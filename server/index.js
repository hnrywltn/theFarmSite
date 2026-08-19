require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')
const { Readable } = require('stream')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Resend } = require('resend')
const { google } = require('googleapis')
const { randomUUID } = require('crypto')
const db = require('./db')

const app = express()
const PORT = process.env.PORT || 3001
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const JWT_SECRET = process.env.JWT_SECRET || 'farm-dev-secret-change-in-prod'
const INITIAL_PASSWORD = 'farmPassword2026'
const ADMIN_EMAIL = 'hnrywltn@gmail.com'

// ─── Activity log ─────────────────────────────────────────────────────────────
async function logActivity(actorId, actorEmail, actorName, action, detail = null) {
  try {
    await db.query(
      'INSERT INTO activity (id, actor_id, actor_email, actor_name, action, detail) VALUES ($1,$2,$3,$4,$5,$6)',
      [randomUUID(), actorId, actorEmail, actorName, action, detail]
    )
  } catch (err) {
    console.error('logActivity failed:', err.message)
  }
}

async function requireOwner(req, res, next) {
  const rows = await db.query('SELECT is_owner FROM users WHERE id = $1', [req.user.id])
  if (!rows[0]?.is_owner) return res.status(403).json({ error: 'Owners only' })
  next()
}

function displayName(user) {
  return user?.name || user?.email?.split('@')[0] || 'unknown'
}

async function displayNameById(userId) {
  try {
    const rows = await db.query('SELECT name, email FROM users WHERE id = $1', [userId])
    return displayName(rows[0])
  } catch { return 'unknown' }
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

let resend = null
if (process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY)

// ─── Google Drive auth ─────────────────────────────────────────────────────────
let drive = null
try {
  let credentials = null
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, 'base64').toString('utf8'))
    console.log('Drive: using full service account JSON')
  } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8'),
    }
    console.log('Drive: using client_email + private_key')
  }
  if (credentials) {
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive'] })
    drive = google.drive({ version: 'v3', auth })
    console.log('Drive: initialized')
  }
} catch (err) {
  console.error('Drive init failed:', err.message)
}

app.use(cors())
app.use(express.json())

// ─── Auth: login ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const rows = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()])
  const user = db.mapUser(rows[0])
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  if (user.suspended) return res.status(403).json({ error: 'Account suspended' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  logActivity(user.id, user.email, displayName(user), 'signed_in')
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isOwner: user.isOwner } })
})

// ─── Auth: refresh current user (name/owner status may have changed) ─────────
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const rows = await db.query('SELECT id, email, name, is_owner FROM users WHERE id = $1', [req.user.id])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  res.json({ id: rows[0].id, email: rows[0].email, name: rows[0].name, isOwner: rows[0].is_owner })
})

// ─── Auth: change password ─────────────────────────────────────────────────────
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })
  const rows = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id])
  const user = db.mapUser(rows[0])
  if (!user) return res.status(404).json({ error: 'User not found' })
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })
  const hash = await bcrypt.hash(newPassword, 10)
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id])
  logActivity(user.id, user.email, displayName(user), 'changed_password')
  res.json({ ok: true })
})

// ─── Users: me (update profile) ───────────────────────────────────────────────
app.patch('/api/users/me', requireAuth, async (req, res) => {
  const { name } = req.body
  if (typeof name !== 'string') return res.status(400).json({ error: 'Name required' })
  const trimmed = name.trim() || null
  const rows = await db.query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name',
    [trimmed, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'User not found' })
  logActivity(req.user.id, req.user.email, displayName(rows[0]), 'updated_name', trimmed)
  res.json({ id: rows[0].id, email: rows[0].email, name: rows[0].name })
})

// ─── Users: list ──────────────────────────────────────────────────────────────
app.get('/api/users', requireAuth, async (req, res) => {
  const rows = await db.query('SELECT id, email, name, added_by, suspended, is_owner, created_at FROM users ORDER BY created_at ASC')
  res.json(rows.map((r) => ({ id: r.id, email: r.email, name: r.name, addedBy: r.added_by, suspended: r.suspended, isOwner: r.is_owner, createdAt: r.created_at })))
})

// ─── Users: add ───────────────────────────────────────────────────────────────
app.post('/api/users', requireAuth, async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })
  const exists = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()])
  if (exists.length) return res.status(409).json({ error: 'User already exists' })
  const hash = await bcrypt.hash(INITIAL_PASSWORD, 10)
  const id = randomUUID()
  const normalised = email.trim().toLowerCase()
  await db.query(
    'INSERT INTO users (id, email, password_hash, added_by) VALUES ($1, $2, $3, $4)',
    [id, normalised, hash, req.user.id]
  )
  const created = (await db.query('SELECT created_at FROM users WHERE id = $1', [id]))[0].created_at
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'invited_user', normalised)
  res.json({ id, email: normalised, addedBy: req.user.id, suspended: false, createdAt: created })
})

// ─── Users: suspend / unsuspend ───────────────────────────────────────────────
app.patch('/api/users/:id', requireAuth, async (req, res) => {
  const rows = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  const target = db.mapUser(rows[0])
  if (!target) return res.status(404).json({ error: 'Not found' })
  if (target.id === req.user.id) return res.status(403).json({ error: 'Cannot modify your own account' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && target.addedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  const newSuspended = req.body.suspended ?? !target.suspended
  await db.query('UPDATE users SET suspended = $1 WHERE id = $2', [newSuspended, target.id])
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), newSuspended ? 'suspended_user' : 'unsuspended_user', target.email)
  res.json({ id: target.id, email: target.email, name: target.name, addedBy: target.addedBy, suspended: newSuspended, isOwner: target.isOwner, createdAt: target.createdAt })
})

// ─── Users: toggle owner status (admin only) ─────────────────────────────────
app.patch('/api/users/:id/owner', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })
  const rows = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  const target = db.mapUser(rows[0])
  if (!target) return res.status(404).json({ error: 'Not found' })
  const isOwner = !!req.body.isOwner
  await db.query('UPDATE users SET is_owner = $1 WHERE id = $2', [isOwner, target.id])
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), isOwner ? 'made_owner' : 'removed_owner', target.email)
  res.json({ id: target.id, email: target.email, name: target.name, addedBy: target.addedBy, suspended: target.suspended, isOwner, createdAt: target.createdAt })
})

// ─── Users: delete ────────────────────────────────────────────────────────────
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  const rows = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  const target = db.mapUser(rows[0])
  if (!target) return res.status(404).json({ error: 'Not found' })
  if (target.id === req.user.id) return res.status(403).json({ error: 'Cannot modify your own account' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && target.addedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  await db.query('DELETE FROM users WHERE id = $1', [target.id])
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'removed_user', target.email)
  res.json({ ok: true })
})

function parseUploader(filename) {
  const sep = filename.indexOf('__')
  return sep !== -1 ? filename.slice(0, sep) : null
}

// ─── Photos: list ─────────────────────────────────────────────────────────────
app.get('/api/photos', async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })
  try {
    const { data } = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })
    let files = data.files.map((f) => ({ id: f.id, name: f.name, uploader: parseUploader(f.name) }))
    const limit = parseInt(req.query.limit, 10)
    if (limit > 0 && limit < files.length) {
      for (let i = files.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[files[i], files[j]] = [files[j], files[i]]
      }
      files = files.slice(0, limit)
    }
    res.json(files)
  } catch (err) {
    console.error('Drive list failed:', err.message)
    res.status(500).json({ error: 'Failed to list photos' })
  }
})

// ─── Photos: proxy image ──────────────────────────────────────────────────────
app.get('/api/photos/:id', async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })
  try {
    const file = await drive.files.get(
      { fileId: req.params.id, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    )
    res.setHeader('Content-Type', file.headers['content-type'] || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    file.data.pipe(res)
  } catch (err) {
    console.error('Drive fetch failed:', err.message)
    res.status(500).json({ error: 'Failed to fetch photo' })
  }
})

// ─── Photos: delete (auth required) ──────────────────────────────────────────
app.delete('/api/photos/:id', requireAuth, async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })
  try {
    await drive.files.delete({ fileId: req.params.id, supportsAllDrives: true })
    logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'deleted_photo')
    res.json({ ok: true })
  } catch (err) {
    console.error('Drive delete failed:', err.message)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// ─── Photos: upload (auth required) ──────────────────────────────────────────
app.post('/api/photos/upload', requireAuth, upload.array('photos', 20), async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })
  if (!req.files?.length) return res.status(400).json({ error: 'No files provided' })
  try {
    const uploaderRows = await db.query('SELECT name, email FROM users WHERE id = $1', [req.user.id])
    const uploaderName = displayName(uploaderRows[0])
    const uploaded = await Promise.all(
      req.files.map((file) =>
        drive.files.create({
          requestBody: { name: `${uploaderName}__${file.originalname}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] },
          media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
          fields: 'id, name',
          supportsAllDrives: true,
        })
      )
    )
    logActivity(req.user.id, req.user.email, uploaderName, 'uploaded_photos', String(req.files.length))
    res.json(uploaded.map((r) => r.data))
  } catch (err) {
    console.error('Drive upload failed:', err.message)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// ─── Activity log: fetch (admin only) ────────────────────────────────────────
app.get('/api/activity', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })
  const rows = await db.query('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 500')
  res.json(rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    actorId: r.actor_id,
    actorEmail: r.actor_email,
    actorName: r.actor_name,
    action: r.action,
    detail: r.detail,
  })))
})

// ─── Polls (owners only) ───────────────────────────────────────────────────────
const POLL_VISIBILITIES = ['immediate', 'after_vote', 'after_close']

app.get('/api/polls', requireAuth, requireOwner, async (req, res) => {
  const polls = await db.query('SELECT * FROM polls ORDER BY created_at DESC')
  const voteRows = await db.query(
    `SELECT pv.poll_id, pv.user_id, pv.option_index, pv.note, pv.voted_at, u.name, u.email
     FROM poll_votes pv JOIN users u ON u.id = pv.user_id`
  )
  const [{ count: ownerCount }] = await db.query('SELECT COUNT(*) FROM users WHERE is_owner = TRUE')
  const creatorIds = [...new Set(polls.map((p) => p.created_by))]
  const creators = creatorIds.length
    ? await db.query('SELECT id, name, email FROM users WHERE id = ANY($1)', [creatorIds])
    : []
  const creatorMap = Object.fromEntries(creators.map((c) => [c.id, displayName(c)]))

  res.json(polls.map((p) => {
    const pollVotes = voteRows.filter((v) => v.poll_id === p.id)
    const myVote = pollVotes.find((v) => v.user_id === req.user.id)
    const resultsVisible =
      p.visibility === 'immediate' ||
      (p.visibility === 'after_vote' && !!myVote) ||
      (p.visibility === 'after_close' && p.status === 'closed')
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      options: p.options,
      visibility: p.visibility,
      status: p.status,
      createdBy: p.created_by,
      createdByName: creatorMap[p.created_by] || 'unknown',
      createdAt: p.created_at,
      closedAt: p.closed_at,
      myVote: myVote ? { optionIndex: myVote.option_index, note: myVote.note } : null,
      totalVotes: pollVotes.length,
      totalOwners: parseInt(ownerCount, 10),
      resultsVisible,
      votes: resultsVisible
        ? pollVotes.map((v) => ({ userId: v.user_id, name: displayName(v), optionIndex: v.option_index, note: v.note, votedAt: v.voted_at }))
        : [],
    }
  }))
})

app.post('/api/polls', requireAuth, requireOwner, async (req, res) => {
  const { title, description, options, visibility } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' })
  const cleanOptions = Array.isArray(options) ? options.map((o) => String(o).trim()).filter(Boolean) : []
  if (cleanOptions.length < 2) return res.status(400).json({ error: 'At least 2 options required' })
  if (!POLL_VISIBILITIES.includes(visibility)) return res.status(400).json({ error: 'Invalid visibility' })
  const id = randomUUID()
  await db.query(
    'INSERT INTO polls (id, title, description, options, visibility, created_by) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, title.trim(), description?.trim() || null, JSON.stringify(cleanOptions), visibility, req.user.id]
  )
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'created_poll', title.trim())
  res.json({ ok: true, id })
})

app.post('/api/polls/:id/vote', requireAuth, requireOwner, async (req, res) => {
  const rows = await db.query('SELECT * FROM polls WHERE id = $1', [req.params.id])
  const poll = rows[0]
  if (!poll) return res.status(404).json({ error: 'Not found' })
  if (poll.status === 'closed') return res.status(403).json({ error: 'Poll is closed' })
  const { optionIndex, note } = req.body
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    return res.status(400).json({ error: 'Invalid option' })
  }
  await db.query(
    `INSERT INTO poll_votes (id, poll_id, user_id, option_index, note)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (poll_id, user_id) DO UPDATE SET option_index = $4, note = $5, voted_at = NOW()`,
    [randomUUID(), poll.id, req.user.id, optionIndex, note?.trim() || null]
  )
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'voted_poll', poll.title)
  res.json({ ok: true })
})

app.post('/api/polls/:id/close', requireAuth, requireOwner, async (req, res) => {
  const rows = await db.query('SELECT * FROM polls WHERE id = $1', [req.params.id])
  const poll = rows[0]
  if (!poll) return res.status(404).json({ error: 'Not found' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && poll.created_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  await db.query("UPDATE polls SET status = 'closed', closed_at = NOW() WHERE id = $1", [poll.id])
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'closed_poll', poll.title)
  res.json({ ok: true })
})

app.delete('/api/polls/:id', requireAuth, requireOwner, async (req, res) => {
  const rows = await db.query('SELECT * FROM polls WHERE id = $1', [req.params.id])
  const poll = rows[0]
  if (!poll) return res.status(404).json({ error: 'Not found' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && poll.created_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  await db.query('DELETE FROM polls WHERE id = $1', [poll.id])
  logActivity(req.user.id, req.user.email, await displayNameById(req.user.id), 'deleted_poll', poll.title)
  res.json({ ok: true })
})

// ─── Guestbook ────────────────────────────────────────────────────────────────
app.get('/api/guestbook', async (req, res) => {
  try {
    const rows = await db.query('SELECT id, name, message, created_at FROM guestbook ORDER BY created_at DESC')
    res.json(rows.map((r) => ({ id: r.id, name: r.name, message: r.message, createdAt: r.created_at })))
  } catch (err) {
    console.error('Guestbook fetch failed:', err.message)
    res.status(500).json({ error: 'Failed to fetch entries' })
  }
})

app.post('/api/guestbook', async (req, res) => {
  const { name, message } = req.body
  if (!name?.trim() || !message?.trim()) return res.status(400).json({ error: 'Name and message required' })
  if (message.trim().length > 500) return res.status(400).json({ error: 'Message too long' })
  try {
    const id = randomUUID()
    await db.query(
      'INSERT INTO guestbook (id, name, message) VALUES ($1, $2, $3)',
      [id, name.trim(), message.trim()]
    )
    const row = (await db.query('SELECT id, name, message, created_at FROM guestbook WHERE id = $1', [id]))[0]
    res.json({ id: row.id, name: row.name, message: row.message, createdAt: row.created_at })
  } catch (err) {
    console.error('Guestbook post failed:', err.message)
    res.status(500).json({ error: 'Failed to save entry' })
  }
})

app.delete('/api/guestbook/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM guestbook WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('Guestbook delete failed:', err.message)
    res.status(500).json({ error: 'Failed to delete entry' })
  }
})

// ─── Contact form ──────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' })
  if (!resend) {
    console.warn('RESEND_API_KEY not set — email not sent')
    return res.json({ ok: true })
  }
  try {
    await resend.emails.send({
      from: 'contact@nanaandpapas.com',
      to: process.env.CONTACT_EMAIL,
      subject: `Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Email send failed:', err.message)
    res.status(500).json({ error: 'Failed to send' })
  }
})

// ─── Serve client in production ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

db.init().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => {
  console.error('Database init failed:', err)
  process.exit(1)
})
