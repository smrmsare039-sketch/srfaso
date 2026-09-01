// Charge .env.local puis .env pour les scripts Node lancés hors de Next.js.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const file of ['.env.local', '.env']) {
  const full = path.join(root, file)
  if (fs.existsSync(full)) dotenv.config({ path: full })
}

export { root }
