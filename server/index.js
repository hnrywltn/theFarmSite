require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { Readable } = require('stream')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Resend } = require('resend')
const { google } = require('googleapis')

const app = express()
const PORT = process.env.PORT || 3001
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const JWT_SECRET = process.env.JWT_SECRET || 'farm-dev-secret-change-in-prod'
const USERS_FILE = path.join(__dirname, 'users.json')
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

// ─── Users file ────────────────────────────────────────────────────────────────
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

async function ensureUsers() {
  if (fs.existsSync(USERS_FILE)) return
  const hash = await bcrypt.hash(INITIAL_PASSWORD, 10)
  const users = SEED_EMAILS.map((email) => ({
    id: crypto.randomUUID(),
    email,
    name: null,
    passwordHash: hash,
    addedBy: null,
    suspended: false,
    createdAt: new Date().toISOString(),
  }))
  saveUsers(users)
  console.log(`Seeded users.json with ${users.length} users`)
}

// ─── Activity log ─────────────────────────────────────────────────────────────
const ACTIVITY_FILE = path.join(__dirname, 'activity.json')

function logActivity(actorId, actorEmail, actorName, action, detail = null) {
  let entries = []
  try { entries = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) } catch {}
  entries.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), actorId, actorEmail, actorName, action, detail })
  if (entries.length > 500) entries.length = 500
  try { fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(entries, null, 2)) } catch {}
}

function displayName(user) {
  return user?.name || user?.email?.split('@')[0] || 'unknown'
}

function displayNameById(userId) {
  try {
    const u = loadUsers().find((u) => u.id === userId)
    return displayName(u)
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
if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  drive = google.drive({ version: 'v3', auth })
}

app.use(cors())
app.use(express.json())

// ─── Auth: login ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const users = loadUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  if (user.suspended) return res.status(403).json({ error: 'Account suspended' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  logActivity(user.id, user.email, displayName(user), 'signed_in')
  res.json({ token, user: { id: user.id, email: user.email, name: user.name || null } })
})

// ─── Auth: change password ─────────────────────────────────────────────────────
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })
  const users = loadUsers()
  const user = users.find((u) => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  saveUsers(users)
  logActivity(user.id, user.email, displayName(user), 'changed_password')
  res.json({ ok: true })
})

// ─── Users: me (update profile) ───────────────────────────────────────────────
app.patch('/api/users/me', requireAuth, (req, res) => {
  const { name } = req.body
  if (typeof name !== 'string') return res.status(400).json({ error: 'Name required' })
  const users = loadUsers()
  const user = users.find((u) => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  user.name = name.trim() || null
  saveUsers(users)
  logActivity(user.id, user.email, displayName(user), 'updated_name', user.name)
  res.json({ id: user.id, email: user.email, name: user.name })
})

// ─── Users: list ──────────────────────────────────────────────────────────────
app.get('/api/users', requireAuth, (req, res) => {
  const users = loadUsers()
  res.json(users.map(({ id, email, name, addedBy, suspended, createdAt }) => ({ id, email, name, addedBy, suspended, createdAt })))
})

// ─── Users: add ───────────────────────────────────────────────────────────────
app.post('/api/users', requireAuth, async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })
  const users = loadUsers()
  if (users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(409).json({ error: 'User already exists' })
  }
  const hash = await bcrypt.hash(INITIAL_PASSWORD, 10)
  const newUser = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    name: null,
    passwordHash: hash,
    addedBy: req.user.id,
    suspended: false,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveUsers(users)
  logActivity(req.user.id, req.user.email, displayNameById(req.user.id), 'invited_user', newUser.email)
  res.json({ id: newUser.id, email: newUser.email, addedBy: newUser.addedBy, suspended: false, createdAt: newUser.createdAt })
})

// ─── Users: suspend / unsuspend ───────────────────────────────────────────────
app.patch('/api/users/:id', requireAuth, (req, res) => {
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  if (users[idx].id === req.user.id) return res.status(403).json({ error: 'Cannot modify your own account' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && users[idx].addedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  users[idx].suspended = req.body.suspended ?? !users[idx].suspended
  saveUsers(users)
  logActivity(req.user.id, req.user.email, displayNameById(req.user.id), users[idx].suspended ? 'suspended_user' : 'unsuspended_user', users[idx].email)
  const { id, email, addedBy, suspended, createdAt } = users[idx]
  res.json({ id, email, addedBy, suspended, createdAt })
})

// ─── Users: delete ────────────────────────────────────────────────────────────
app.delete('/api/users/:id', requireAuth, (req, res) => {
  const users = loadUsers()
  const user = users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  if (user.id === req.user.id) return res.status(403).json({ error: 'Cannot modify your own account' })
  const isAdmin = req.user.email === ADMIN_EMAIL
  if (!isAdmin && user.addedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  saveUsers(users.filter((u) => u.id !== req.params.id))
  logActivity(req.user.id, req.user.email, displayNameById(req.user.id), 'removed_user', user.email)
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
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })
    res.json(data.files.map((f) => ({ id: f.id, name: f.name, uploader: parseUploader(f.name) })))
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
    logActivity(req.user.id, req.user.email, displayNameById(req.user.id), 'deleted_photo')
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
    const users = loadUsers()
    const uploader = users.find((u) => u.id === req.user.id)
    const displayName = uploader?.name || uploader?.email.split('@')[0] || 'unknown'

    const uploaded = await Promise.all(
      req.files.map((file) =>
        drive.files.create({
          requestBody: {
            name: `${displayName}__${file.originalname}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
          },
          fields: 'id, name',
          supportsAllDrives: true,
        })
      )
    )
    logActivity(req.user.id, req.user.email, displayName(uploader), 'uploaded_photos', String(req.files.length))
    res.json(uploaded.map((r) => r.data))
  } catch (err) {
    console.error('Drive upload failed:', err.message)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// ─── Activity log: fetch (admin only) ────────────────────────────────────────
app.get('/api/activity', requireAuth, (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' })
  let entries = []
  try { entries = JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf8')) } catch {}
  res.json(entries)
})

// ─── Contact form ──────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' })
  }
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

ensureUsers().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
