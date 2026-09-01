// Crée (ou réactive) un compte administrateur du back-office.
// Usage : node scripts/create-admin.mjs [email] [motdepasse] ["Nom complet"]
// À défaut d'arguments, lit ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME de .env.local
import { createClient } from '@supabase/supabase-js'
import './env.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const email = process.argv[2] || process.env.ADMIN_EMAIL
const password = process.argv[3] || process.env.ADMIN_PASSWORD
const fullName = process.argv[4] || process.env.ADMIN_NAME || 'Administrateur'

if (!url || !serviceKey) {
  console.error(
    '\nNEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.\n'
  )
  process.exit(1)
}
if (!email || !password) {
  console.error('\nEmail ou mot de passe administrateur manquant.\n')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(target) {
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase())
    if (found) return found
    if (data.users.length < 200) return null
    page++
  }
}

async function main() {
  const existing = await findUserByEmail(email)
  let userId

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, full_name: fullName, backoffice: 'true' },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`Compte existant mis a jour : ${email}`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, backoffice: 'true', role: 'admin' },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`Compte administrateur cree : ${email}`)
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    { id: userId, email, full_name: fullName, role: 'admin', is_active: true },
    { onConflict: 'id' }
  )
  if (profileError) throw profileError

  console.log('Profil back-office actif. Connexion sur /admin/login')
}

main().catch((err) => {
  console.error(`\nEchec : ${err.message}\n`)
  process.exit(1)
})
