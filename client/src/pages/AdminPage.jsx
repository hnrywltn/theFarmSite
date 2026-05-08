import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function ChangePassword({ token }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (next !== confirm) { setError('New passwords do not match'); return }
    if (next.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setError(data.error)
    }
  }

  return (
    <div className="border border-farm-cream/10 p-6">
      <h2 className="font-serif text-xl text-farm-cream mb-6">Change Password</h2>
      {success && <p className="text-green-400 text-sm mb-4">Password updated.</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {[
          { value: current, set: setCurrent, placeholder: 'Current password' },
          { value: next, set: setNext, placeholder: 'New password' },
          { value: confirm, set: setConfirm, placeholder: 'Confirm new password' },
        ].map(({ value, set, placeholder }) => (
          <input
            key={placeholder}
            type="password"
            value={value}
            onChange={(e) => { set(e.target.value); setError(''); setSuccess(false) }}
            placeholder={placeholder}
            required
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
        ))}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-40 self-start mt-1"
        >
          {loading ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

function UserManagement({ token, currentUserId }) {
  const [users, setUsers] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

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
          const canManage = u.addedBy === currentUserId
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
  )
}

export default function AdminPage() {
  const { token, user } = useAuth()

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

          <div className="grid md:grid-cols-2 gap-6">
            <ChangePassword token={token} />
            <UserManagement token={token} currentUserId={user?.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
