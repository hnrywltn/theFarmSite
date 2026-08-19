import { useState, useEffect, useCallback } from 'react'
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
    <div className="bg-farm-dark border border-farm-cream/10 p-6 flex flex-col gap-8">
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

function SetPasswordModal({ userId, email, token, onClose, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newPassword: password }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onDone()
    else setError(data.error)
  }

  return (
    <div className="fixed inset-0 z-50 bg-farm-dark/90 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-farm-dark border border-farm-gold/20 p-8 w-full max-w-sm flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="font-serif text-xl text-farm-cream font-light">Set Password</h2>
          <p className="text-farm-cream/40 text-xs mt-1">For {email}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="New password"
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            placeholder="Confirm password"
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2.5 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 flex-1"
            >
              {saving ? 'Saving…' : 'Set Password'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="label-sm text-farm-cream/40 border border-farm-cream/15 px-5 py-2.5 hover:text-farm-cream hover:border-farm-cream/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
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
  const [passwordTarget, setPasswordTarget] = useState(null)

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

  async function handleToggleOwner(u) {
    setActionLoading(`${u.id}-owner`)
    const res = await fetch(`/api/users/${u.id}/owner`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isOwner: !u.isOwner }),
    })
    const data = await res.json()
    setActionLoading(null)
    if (res.ok) setUsers((prev) => prev.map((x) => (x.id === data.id ? data : x)))
  }

  return (
    <>
    {inviteEmail && <InviteModal email={inviteEmail} onClose={() => setInviteEmail(null)} />}
    {passwordTarget && (
      <SetPasswordModal
        userId={passwordTarget.id}
        email={passwordTarget.email}
        token={token}
        onClose={() => setPasswordTarget(null)}
        onDone={() => setPasswordTarget(null)}
      />
    )}
    <div className="bg-farm-dark border border-farm-cream/10 p-6">
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
            <div key={u.id} className="flex flex-wrap items-center justify-between py-3 gap-x-4 gap-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-farm-cream/80 text-sm truncate">{u.email}</span>
                {u.isOwner && (
                  <span className="label-sm text-xs text-farm-gold border border-farm-gold/30 px-2 py-0.5 shrink-0">
                    Owner
                  </span>
                )}
                {u.suspended && (
                  <span className="label-sm text-xs text-red-400 border border-red-400/30 px-2 py-0.5 shrink-0">
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {currentUserEmail === ADMIN_EMAIL && (
                  <button
                    onClick={() => handleToggleOwner(u)}
                    disabled={actionLoading === `${u.id}-owner`}
                    className="label-sm text-xs text-farm-gold/70 hover:text-farm-gold border border-farm-gold/25 hover:border-farm-gold/40 px-3 py-1.5 transition-colors disabled:opacity-30"
                  >
                    {u.isOwner ? 'Remove Owner' : 'Make Owner'}
                  </button>
                )}
                {currentUserEmail === ADMIN_EMAIL && (
                  <button
                    onClick={() => setPasswordTarget({ id: u.id, email: u.email })}
                    className="label-sm text-xs text-farm-cream/40 hover:text-farm-cream border border-farm-cream/15 hover:border-farm-cream/30 px-3 py-1.5 transition-colors"
                  >
                    Set Password
                  </button>
                )}
                {canManage && (
                  <>
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
                  </>
                )}
              </div>
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
    case 'made_owner':      return `made ${detail} an owner`
    case 'reset_password':  return `set a new password for ${detail}`
    case 'removed_owner':   return `removed ${detail} as an owner`
    case 'created_poll':    return `started a vote: "${detail}"`
    case 'voted_poll':      return `voted on "${detail}"`
    case 'closed_poll':     return `closed the vote "${detail}"`
    case 'deleted_poll':    return `deleted the vote "${detail}"`
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
            <div key={e.id} className="flex items-start justify-between gap-4 py-2.5">
              <p className="text-sm text-farm-cream/70 min-w-0">
                <span className="text-farm-cream font-medium">{e.actorName}</span>
                {' '}
                <span>{actionLabel(e.action, e.detail)}</span>
              </p>
              <span
                className="text-farm-cream/30 text-xs shrink-0 pt-0.5"
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

const VISIBILITY_OPTIONS = [
  { value: 'immediate', label: 'Visible immediately', hint: 'Everyone sees choices and notes as votes come in.' },
  { value: 'after_vote', label: 'Visible after you vote', hint: "You'll see others' votes once you've cast your own." },
  { value: 'after_close', label: 'Visible after vote closes', hint: 'Nothing is shown until the vote is closed.' },
]

function visibilityLabel(v) {
  return VISIBILITY_OPTIONS.find((o) => o.value === v)?.label || v
}

const PRIORITY_OPTIONS = [
  { value: 'red', label: 'Red — Urgent', hint: 'Something required, needs a decision soon.', dot: 'bg-red-400', text: 'text-red-400', border: 'border-red-400/40' },
  { value: 'yellow', label: 'Yellow — Important', hint: 'Matters, but no rush.', dot: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400/40' },
  { value: 'green', label: 'Green — Nice to have', hint: 'Optional extras, like art for the cabin.', dot: 'bg-green-400', text: 'text-green-400', border: 'border-green-400/40' },
]

function priorityMeta(p) {
  return PRIORITY_OPTIONS.find((o) => o.value === p) || PRIORITY_OPTIONS[1]
}

function formatMoney(n) {
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function NewPollForm({ token, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [visibility, setVisibility] = useState('immediate')
  const [priority, setPriority] = useState('yellow')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateOption(i, value) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const cleaned = options.map((o) => o.trim()).filter(Boolean)
    if (!title.trim()) { setError('Title required'); return }
    if (cleaned.length < 2) { setError('Add at least 2 options'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, options: cleaned, visibility, priority }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onCreated()
    else setError(data.error)
  }

  return (
    <form onSubmit={handleSubmit} className="border border-farm-gold/20 p-5 flex flex-col gap-4 mb-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What are we deciding?"
        className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-2.5 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-2.5 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
      />
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={o}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-2 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-farm-cream/40 hover:text-red-400 px-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptions((prev) => [...prev, ''])}
          className="label-sm text-xs text-farm-cream/40 hover:text-farm-cream self-start"
        >
          + Add option
        </button>
      </div>
      <div>
        <p className="label-sm text-xs text-farm-cream/40 mb-2">Priority</p>
        <div className="flex flex-col gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-start gap-2 text-sm text-farm-cream/70 cursor-pointer">
              <input
                type="radio"
                name="priority"
                checked={priority === opt.value}
                onChange={() => setPriority(opt.value)}
                className="mt-1"
              />
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                <span>
                  {opt.label}
                  <span className="block text-farm-cream/30 text-xs">{opt.hint}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="label-sm text-xs text-farm-cream/40 mb-2">Vote visibility</p>
        <div className="flex flex-col gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-start gap-2 text-sm text-farm-cream/70 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
                className="mt-1"
              />
              <span>
                {opt.label}
                <span className="block text-farm-cream/30 text-xs">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2.5 hover:bg-farm-gold/10 transition-colors disabled:opacity-40"
        >
          {saving ? 'Starting…' : 'Start Vote'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="label-sm text-farm-cream/40 border border-farm-cream/15 px-5 py-2.5 hover:text-farm-cream hover:border-farm-cream/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function PollCard({ poll, token, currentUserId, isAdmin, onChanged }) {
  const [selected, setSelected] = useState(poll.myVote?.optionIndex ?? null)
  const [note, setNote] = useState(poll.myVote?.note || '')
  const [pledge, setPledge] = useState(poll.myVote?.pledgeAmount != null ? String(poll.myVote.pledgeAmount) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showVoters, setShowVoters] = useState(false)

  async function handleVote(e) {
    e.preventDefault()
    if (selected === null) { setError('Choose an option'); return }
    if (pledge && (isNaN(Number(pledge)) || Number(pledge) < 0)) { setError('Enter a valid pledge amount'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ optionIndex: selected, note, pledgeAmount: pledge ? Number(pledge) : null }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onChanged()
    else setError(data.error)
  }

  async function handleClose() {
    if (!window.confirm('Close this vote? No more votes will be accepted.')) return
    await fetch(`/api/polls/${poll.id}/close`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    onChanged()
  }

  async function handleDelete() {
    if (!window.confirm('Delete this vote?')) return
    await fetch(`/api/polls/${poll.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    onChanged()
  }

  const canManagePoll = isAdmin || poll.createdBy === currentUserId
  const counts = poll.options.map((_, i) => poll.votes.filter((v) => v.optionIndex === i).length)
  const maxCount = Math.max(1, ...counts)
  const priority = priorityMeta(poll.priority)

  return (
    <div className="border border-farm-cream/10 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-2 h-2 rounded-full ${priority.dot}`} title={priority.label} />
            <h3 className="font-serif text-lg text-farm-cream">{poll.title}</h3>
          </div>
          {poll.description && <p className="text-farm-cream/50 text-sm mt-1">{poll.description}</p>}
        </div>
        <span
          className={`label-sm text-xs px-2 py-0.5 border shrink-0 ${
            poll.status === 'open' ? 'text-farm-gold border-farm-gold/30' : 'text-farm-cream/40 border-farm-cream/15'
          }`}
        >
          {poll.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </div>

      <p className="text-farm-cream/30 text-xs">
        Started by {poll.createdByName} · {poll.totalVotes} of {poll.totalOwners} voted · {visibilityLabel(poll.visibility)}
      </p>

      {poll.status === 'open' && (
        <form onSubmit={handleVote} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {poll.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-farm-cream/80 cursor-pointer">
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                {opt}
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note with your vote (optional)"
            rows={2}
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-3 py-2 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          <div className="flex items-center gap-2">
            <span className="text-farm-cream/40 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pledge}
              onChange={(e) => setPledge(e.target.value)}
              placeholder="Willing to contribute (optional)"
              className="flex-1 bg-transparent border border-farm-cream/20 text-farm-cream px-3 py-2 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 self-start"
          >
            {saving ? 'Saving…' : poll.myVote ? 'Update Vote' : 'Cast Vote'}
          </button>
        </form>
      )}

      {poll.resultsVisible && poll.totalPledged > 0 && (
        <p className="text-farm-cream/50 text-sm">
          <span className="text-farm-gold">{formatMoney(poll.totalPledged)}</span> pledged so far
        </p>
      )}

      {poll.resultsVisible && (
        <div className="flex flex-col gap-2">
          {poll.options.map((opt, i) => (
            <div key={i} className="text-sm">
              <div className="flex justify-between text-farm-cream/70">
                <span>{opt}</span>
                <span className="text-farm-cream/40">{counts[i]}</span>
              </div>
              <div className="h-1 bg-farm-cream/10 mt-1">
                <div className="h-1 bg-farm-gold/50" style={{ width: `${(counts[i] / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {poll.resultsVisible && poll.votes.length > 0 && (
        <div>
          <button
            onClick={() => setShowVoters((v) => !v)}
            className="label-sm text-xs text-farm-cream/40 hover:text-farm-cream"
          >
            {showVoters ? 'Hide votes' : 'Show votes'}
          </button>
          {showVoters && (
            <div className="mt-3 divide-y divide-farm-cream/10">
              {poll.votes.map((v) => (
                <div key={v.userId} className="py-2 text-sm">
                  <p className="text-farm-cream/80">
                    <span className="font-medium text-farm-cream">{v.name}</span> voted{' '}
                    <span className="text-farm-gold">{poll.options[v.optionIndex]}</span>
                    {v.pledgeAmount != null && (
                      <span className="text-farm-cream/50"> · willing to give {formatMoney(v.pledgeAmount)}</span>
                    )}
                  </p>
                  {v.note && <p className="text-farm-cream/40 text-xs mt-1">{v.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!poll.resultsVisible && poll.myVote && (
        <p className="text-farm-cream/30 text-xs">Your vote is recorded. Results aren't visible yet.</p>
      )}

      {canManagePoll && (
        <div className="flex gap-2 pt-2 border-t border-farm-cream/10">
          {poll.status === 'open' && (
            <button
              onClick={handleClose}
              className="label-sm text-xs text-farm-cream/40 hover:text-farm-cream border border-farm-cream/15 hover:border-farm-cream/30 px-3 py-1.5 transition-colors"
            >
              Close Vote
            </button>
          )}
          <button
            onClick={handleDelete}
            className="label-sm text-xs text-farm-cream/40 hover:text-red-400 border border-farm-cream/15 hover:border-red-400/30 px-3 py-1.5 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function FamilyVotes({ token, currentUserId, isAdmin }) {
  const [polls, setPolls] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    fetch('/api/polls', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPolls(data) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [token])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-farm-dark border border-farm-cream/10 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-farm-cream">Family Votes</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="label-sm text-farm-gold border border-farm-gold/40 px-5 py-2 hover:bg-farm-gold/10 transition-colors"
          >
            + New Vote
          </button>
        )}
      </div>

      {showForm && (
        <NewPollForm
          token={token}
          onCreated={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loaded && polls.length === 0 && <p className="text-farm-cream/30 text-sm">No votes yet.</p>}

      <div className="flex flex-col gap-4">
        {polls.map((p) => (
          <PollCard key={p.id} poll={p} token={token} currentUserId={currentUserId} isAdmin={isAdmin} onChanged={load} />
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { token, user, updateProfile } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <div className="font-sans min-h-screen flex flex-col bg-[url('/farm-bg.jpg')] bg-cover bg-center bg-fixed">
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
              <div key={s.title} className="bg-farm-dark border border-farm-cream/10 p-6">
                <h2 className="font-serif text-xl text-farm-cream mb-2">{s.title}</h2>
                <p className="font-sans font-light text-farm-cream/40 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <AccountSettings token={token} currentName={user?.name} updateProfile={updateProfile} />
            <UserManagement token={token} currentUserId={user?.id} currentUserEmail={user?.email} />
          </div>

          {user?.isOwner && (
            <FamilyVotes token={token} currentUserId={user?.id} isAdmin={isAdmin} />
          )}

          {isAdmin && <ActivityLog token={token} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
