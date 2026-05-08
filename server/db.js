const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const INITIAL_PASSWORD = 'farmPassword2026'
const SEED_EMAILS = [
  'hnrywltn@gmail.com',
  'bshackelford11@gmail.com',
  'ceci.kelly54@gmail.com',
  'chuckiie@hotmail.com',
  'me@zach.us',
  'efechner21@gmail.com',
  'hannah.w.kelly@gmail.com',
]

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function query(text, params) {
  const { rows } = await pool.query(text, params)
  return rows
}

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name || null,
    passwordHash: row.password_hash,
    addedBy: row.added_by || null,
    suspended: row.suspended,
    createdAt: row.created_at,
  }
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      added_by TEXT,
      suspended BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      actor_id TEXT,
      actor_email TEXT,
      actor_name TEXT,
      action TEXT NOT NULL,
      detail TEXT
    )
  `)

  const [{ count }] = await pool.query('SELECT COUNT(*) FROM users')
  if (parseInt(count) === 0) {
    const hash = await bcrypt.hash(INITIAL_PASSWORD, 10)
    for (const email of SEED_EMAILS) {
      await pool.query(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [crypto.randomUUID(), email, hash]
      )
    }
    console.log(`Seeded ${SEED_EMAILS.length} users`)
  }
}

module.exports = { query, mapUser, init }
