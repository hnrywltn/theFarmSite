require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')
const { Readable } = require('stream')
const multer = require('multer')
const { Resend } = require('resend')
const { google } = require('googleapis')

const app = express()
const PORT = process.env.PORT || 3001
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

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

// ─── Photos: list files in Drive folder ───────────────────────────────────────
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
    res.json(data.files)
  } catch (err) {
    console.error('Drive list failed:', err.message)
    res.status(500).json({ error: 'Failed to list photos' })
  }
})

// ─── Photos: proxy image content from Drive ───────────────────────────────────
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

// ─── Photos: delete from Drive ────────────────────────────────────────────────
app.delete('/api/photos/:id', async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })

  try {
    await drive.files.delete({ fileId: req.params.id, supportsAllDrives: true })
    res.json({ ok: true })
  } catch (err) {
    console.error('Drive delete failed:', err.message)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// ─── Photos: upload to Drive folder ───────────────────────────────────────────
app.post('/api/photos/upload', upload.array('photos', 20), async (req, res) => {
  if (!drive) return res.status(503).json({ error: 'Drive not configured' })
  if (!req.files?.length) return res.status(400).json({ error: 'No files provided' })

  try {
    const uploaded = await Promise.all(
      req.files.map((file) =>
        drive.files.create({
          requestBody: {
            name: file.originalname,
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
    res.json(uploaded.map((r) => r.data))
  } catch (err) {
    console.error('Drive upload failed:', err.message)
    res.status(500).json({ error: 'Upload failed' })
  }
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
