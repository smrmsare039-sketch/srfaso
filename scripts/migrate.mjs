// Exécute les fichiers SQL de supabase/migrations dans l'ordre.
// Usage : node scripts/migrate.mjs [--demo]
//
// Deux modes, choisis automatiquement :
//   1. DATABASE_URL renseignée  → connexion Postgres directe (pg)
//   2. sinon SUPABASE_ACCESS_TOKEN (ou `token`) → API Management Supabase
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { root } from './env.mjs'

const migrationsDir = path.join(root, 'supabase', 'migrations')
const withDemo = process.argv.includes('--demo')

const connectionString = process.env.DATABASE_URL
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || process.env.token
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

/** Exécute du SQL via l'API Management (aucun mot de passe Postgres requis). */
function createApiRunner() {
  const ref = new URL(projectUrl).hostname.split('.')[0]
  const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`

  return async function run(sql) {
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        })
        const text = await res.text()
        if (!res.ok) {
          let message = text
          try {
            message = JSON.parse(text).message ?? text
          } catch {
            // réponse non JSON
          }
          throw new Error(message)
        }
        return text ? JSON.parse(text) : null
      } catch (err) {
        lastError = err
        // Erreur SQL : inutile de réessayer. Erreur réseau : on retente.
        if (!/ECONNRESET|fetch failed|ETIMEDOUT/i.test(String(err.cause?.code ?? err.message))) {
          throw err
        }
        await new Promise((r) => setTimeout(r, 500 * attempt))
      }
    }
    throw lastError
  }
}

/** Exécute du SQL via une connexion Postgres directe. */
async function createPgRunner() {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const run = async (sql) => (await client.query(sql)).rows
  run.close = () => client.end()
  return run
}

async function main() {
  let run
  if (connectionString) {
    console.log('→ Connexion Postgres directe (DATABASE_URL)\n')
    run = await createPgRunner()
  } else if (accessToken && projectUrl) {
    console.log('→ API Management Supabase (access token)\n')
    run = createApiRunner()
  } else {
    console.error(
      '\nAucun moyen de connexion.\n' +
        '  Renseigne DATABASE_URL (Supabase > Connect > Session pooler)\n' +
        '  ou SUPABASE_ACCESS_TOKEN (Supabase > Account > Access Tokens) dans .env.local.\n'
    )
    process.exit(1)
  }

  await run(`
    create table if not exists public._migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const rows = await run('select name from public._migrations')
  const applied = new Set((rows ?? []).map((r) => r.name))

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => (withDemo ? true : !f.includes('demo')))
    .sort()

  let count = 0
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`· ${file} — deja appliquee`)
      continue
    }
    const sql = await readFile(path.join(migrationsDir, file), 'utf8')
    process.stdout.write(`> ${file} ... `)
    try {
      await run(sql)
      await run(
        `insert into public._migrations (name) values ('${file.replace(/'/g, "''")}')
         on conflict (name) do nothing`
      )
      console.log('OK')
      count++
    } catch (err) {
      console.log('ECHEC')
      console.error(`\n${err.message}\n`)
      if (run.close) await run.close()
      process.exit(1)
    }
  }

  console.log(`\n${count} migration(s) appliquee(s).`)
  if (run.close) await run.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
