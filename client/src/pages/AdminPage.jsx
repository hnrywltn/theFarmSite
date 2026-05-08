import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function AccountSettings({ token, currentName, updateProfile }) {
  const [name, setName] = useState(currentName || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  async function handleNameSave(e) {
    e.preventDefault()
    setNameSaving(true)
    setNameSuccess(false)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setNameSaving(false)
    if (res.ok) {
      updateProfile({ name: data.name })
      setNameSuccess(true)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (next !== confirm) { setPwError('New passwords do not match'); return }
    if (next.length < 6) { setPwError('Password must be at least 6 characters'); return }
    setPwLoading(true)
    setPwError('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    setPwLoading(false)
    if (res.ok) {
      setPwSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setPwError(data.error)
    }
  }

  return (
    <div className="border border-farm-cream/10 p-6 flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-xl text-farm-cream mb-5">Display Name</h2>
        <form onSubmit={handleNameSave} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameSuccess(false) }}
            placeholder="Your name"
            className="flex-1 bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          <button
            type="submit"
            disabled={nameSaving}
            className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {nameSaving ? 'Saving…' : nameSuccess ? 'Saved' : 'Save'}
          </button>
        </form>
        <p className="text-farm-cream/30 text-xs mt-2">Used to label photos you upload.</p>
      </div>

      <div className="border-t border-farm-cream/10 pt-6">
        <h2 className="font-serif text-xl text-farm-cream mb-5">Change Password</h2>
        {pwSuccess && <p className="text-green-400 text-sm mb-4">Password updated.</p>}
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          {[
            { value: current, set: setCurrent, placeholder: 'Current password' },
            { value: next, set: setNext, placeholder: 'New password' },
            { value: confirm, set: setConfirm, placeholder: 'Confirm new password' },
          ].map(({ value, set, placeholder }) => (
            <input
              key={placeholder}
              type="password"
              value={value}
              onChange={(e) => { set(e.target.value); setPwError(''); setPwSuccess(false) }}
              placeholder={placeholder}
              required
              className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
            />
          ))}
          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 self-start mt-1"
          >
            {pwLoading ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const INITIAL_PASSWORD = 'farmPassword2026'
const SITE_URL = 'https://nanaandpapas.com'
const ADMIN_EMAIL = 'hnrywltn@gmail.com'

function InviteModal({ email, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = `You've been added to nanaandpapas.com.\n\nWebsite: ${SITE_URL}\nEmail: ${email}\nPassword: ${INITIAL_PASSWORD}\n\nYou can change your password in the admin panel after signing in.`

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-farm-dark/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-farm-dark border border-farm-gold/20 p-8 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl text-farm-cream font-light">User Added</h2>
        <div className="bg-farm-green/30 border border-farm-cream/10 p-4 flex flex-col gap-2">
          <Row label="Website" value={SITE_URL} />
          <Row label="Email" value={email} />
          <Row label="Password" value={INITIAL_PASSWORD} />
        </div>
        <p className="text-farm-cream/40 text-xs leading-relaxed">
          Send this to {email} so they can sign in. They can change their password in the admin panel.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2.5 hover:bg-farm-gold/10 transition-colors flex-1"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            className="label-sm text-farm-cream/40 border border-farm-cream/15 px-5 py-2.5 hover:text-farm-cream hover:border-farm-cream/30 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-farm-cream/40 shrink-0">{label}</span>
      <span className="text-farm-cream font-mono text-right break-all">{value}</span>
    </div>
  )
}

function UserManagement({ token, currentUserId, currentUserEmail }) {
  const [users, setUsers] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [inviteEmail, setInviteEmail] = useState(null)

  useEffect(() => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
  }, [token])

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      setUsers((prev) => [...prev, data])
      setNewEmail('')
      setInviteEmail(data.email)
    } else {
      setAddError(data.error)
    }
  }

  async function handleSuspend(user) {
    setActionLoading(`${user.id}-suspend`)
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ suspended: !user.suspended }),
    })
    const data = await res.json()
    setActionLoading(null)
    if (res.ok) setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)))
  }

  async function handleDelete(userId) {
    if (!window.confirm('Remove this user?')) return
    setActionLoading(`${userId}-delete`)
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setActionLoading(null)
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  return (
    <>
    {inviteEmail && <InviteModal email={inviteEmail} onClose={() => setInviteEmail(null)} />}
    <div className="border border-farm-cream/10 p-6">
      <h2 className="font-serif text-xl text-farm-cream mb-6">Users</h2>

      <form onSubmit={handleAdd} className="flex gap-3 mb-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setAddError('') }}
          placeholder="Add user by email"
          className="flex-1 bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-2.5 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
        />
        <button
          type="submit"
          disabled={adding || !newEmail}
          className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2.5 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </form>
      {addError && <p className="text-red-400 text-xs mb-4">{addError}</p>}

      <div className="divide-y divide-farm-cream/10 mt-6">
        {users.map((u) => {
          const isAdmin = currentUserEmail === ADMIN_EMAIL
          const canManage = u.id !== currentUserId && (isAdmin || u.addedBy === currentUserId)
          return (
            <div key={u.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-farm-cream/80 text-sm truncate">{u.email}</span>
                {u.suspended && (
                  <span className="label-sm text-xs text-red-400 border border-red-400/30 px-2 py-0.5 shrink-0">
                    Suspended
                  </span>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleSuspend(u)}
                    disabled={actionLoading === `${u.id}-suspend`}
                    className="label-sm text-xs text-farm-cream/40 hover:text-farm-cream border border-farm-cream/15 hover:border-farm-cream/30 px-3 py-1.5 transition-colors disabled:opacity-30"
                  >
                    {u.suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={actionLoading === `${u.id}-delete`}
                    className="label-sm text-xs text-farm-cream/40 hover:text-red-400 border border-farm-cream/15 hover:border-red-400/30 px-3 py-1.5 transition-colors disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function actionLabel(action, detail) {
  switch (action) {
    case 'signed_in':       return 'signed in'
    case 'uploaded_photos': return `uploaded ${detail} photo${detail === '1' ? '' : 's'}`
    case 'deleted_photo':   return 'deleted a photo'
    case 'invited_user':    return `invited ${detail}`
    case 'suspended_user':  return `suspended ${detail}`
    case 'unsuspended_user':return `unsuspended ${detail}`
    case 'removed_user':    return `removed ${detail}`
    case 'changed_password':return 'changed their password'
    case 'updated_name':    return detail ? `set display name to "${detail}"` : 'cleared their display name'
    default:                return action
  }
}

function ActivityLog({ token }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    fetch('/api/activity', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setEntries(data))
      .catch(() => {})
  }, [token])

  return (
    <div className="border border-farm-cream/10 p-6">
      <h2 className="font-serif text-xl text-farm-cream mb-6">Activity</h2>
      {entries.length === 0 ? (
        <p className="text-farm-cream/30 text-sm">No activity yet.</p>
      ) : (
        <div className="divide-y divide-farm-cream/10 max-h-96 overflow-y-auto">
          {entries.map((e) => (
            <div key={e.id} className="flex items-baseline justify-between gap-4 py-2.5">
              <p className="text-sm text-farm-cream/70">
                <span className="text-farm-cream font-medium">{e.actorName}</span>
                {' '}
                <span>{actionLabel(e.action, e.detail)}</span>
              </p>
              <span
                className="text-farm-cream/30 text-xs shrink-0"
                title={new Date(e.timestamp).toLocaleString()}
              >
                {relativeTime(e.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { token, user, updateProfile } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <div className="font-sans bg-farm-dark min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 section-pad pt-32">
        <div className="max-w-5xl mx-auto">
          <p className="label-sm text-farm-gold mb-6">Admin</p>
          <h1 className="font-serif text-4xl md:text-5xl text-farm-cream font-light mb-16">
            State of the Farm
          </h1>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              { title: 'Conditions', desc: 'Water, structures, fields, equipment — current state at a glance.' },
              { title: 'Expenses', desc: 'Running log of costs, who paid, what for.' },
              { title: 'Work Log', desc: "What's been done, what's pending, who handled it." },
              { title: 'Updates', desc: 'Shared family notes so no one is out of the loop.' },
            ].map((s) => (
              <div key={s.title} className="border border-farm-cream/10 p-6">
                <h2 className="font-serif text-xl text-farm-cream mb-2">{s.title}</h2>
                <p className="font-sans font-light text-farm-cream/40 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <AccountSettings token={token} currentName={user?.name} updateProfile={updateProfile} />
            <UserManagement token={token} currentUserId={user?.id} currentUserEmail={user?.email} />
          </div>

          {isAdmin && <ActivityLog token={token} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
