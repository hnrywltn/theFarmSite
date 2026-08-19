const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')

const INITIAL_PASSWORD = 'farmPassword2026'
const ADMIN_EMAIL = 'hnrywltn@gmail.com'
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
    isOwner: row.is_owner || false,
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
      is_owner BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      options JSONB NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'immediate',
      priority TEXT NOT NULL DEFAULT 'yellow',
      status TEXT NOT NULL DEFAULT 'open',
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    )
  `)
  await pool.query("ALTER TABLE polls ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'yellow'")

  await pool.query(`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      option_index INT NOT NULL,
      note TEXT,
      pledge_amount NUMERIC(10,2),
      voted_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(poll_id, user_id)
    )
  `)
  await pool.query('ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS pledge_amount NUMERIC(10,2)')

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guestbook (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const [{ count }] = await query('SELECT COUNT(*) FROM users')
  if (parseInt(count) === 0) {
    const hash = await bcrypt.hash(INITIAL_PASSWORD, 10)
    for (const email of SEED_EMAILS) {
      await pool.query(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [randomUUID(), email, hash]
      )
    }
    console.log(`Seeded ${SEED_EMAILS.length} users`)
  }

  await pool.query('UPDATE users SET is_owner = TRUE WHERE LOWER(email) = LOWER($1)', [ADMIN_EMAIL])
}

module.exports = { query, mapUser, init }
