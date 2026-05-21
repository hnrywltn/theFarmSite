import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useAuth } from '../context/AuthContext'

function Entry({ entry, onDelete }) {
  const { isLoggedIn, token } = useAuth()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Remove this entry?')) return
    setDeleting(true)
    try {
      await fetch(`/api/guestbook/${entry.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      onDelete(entry.id)
    } catch {}
    finally { setDeleting(false) }
  }

  const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="border-t border-farm-gold/15 pt-6 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-sans font-light text-farm-cream/80 leading-relaxed">{entry.message}</p>
          <p className="mt-3 label-sm text-farm-gold/60 tracking-widest">
            {entry.name} &middot; {date}
          </p>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 p-1 text-farm-cream/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-10"
            title="Remove entry"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function Guestbook() {
  const [ref, inView] = useInView()
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/guestbook')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setEntries(data))
      .catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || 'Something went wrong')
        return
      }
      const entry = await res.json()
      setEntries((prev) => [entry, ...prev])
      setName('')
      setMessage('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch {
      setError('Something went wrong — try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="guestbook" className="section-pad bg-farm-green">
      <div
        ref={ref}
        className={`max-w-2xl mx-auto transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <p className="label-sm text-farm-gold mb-6">The Farm</p>

        <h2 className="font-serif text-4xl md:text-5xl text-farm-cream font-light leading-snug mb-4">
          Guestbook
        </h2>

        <p className="font-sans font-light text-farm-cream/50 text-sm leading-relaxed mb-12">
          If you've spent time out here, leave a note. A memory, a moment, whatever comes to mind.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-16">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            className="w-full bg-transparent border border-farm-gold/25 text-farm-cream placeholder-farm-cream/25 font-sans font-light text-sm px-4 py-3 focus:outline-none focus:border-farm-gold/50 transition-colors"
          />
          <textarea
            placeholder="A sentence or two about your visit…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            required
            rows={4}
            className="w-full bg-transparent border border-farm-gold/25 text-farm-cream placeholder-farm-cream/25 font-sans font-light text-sm px-4 py-3 focus:outline-none focus:border-farm-gold/50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-farm-cream/25 text-xs font-sans">
              {message.length > 0 && `${message.length} / 500`}
            </span>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !message.trim()}
              className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-30"
            >
              {submitting ? 'Leaving note…' : 'Leave a note'}
            </button>
          </div>
          {submitted && (
            <p className="text-farm-cream/50 text-xs font-sans">Thanks for signing the guestbook.</p>
          )}
          {error && (
            <p className="text-red-400/70 text-xs font-sans">{error}</p>
          )}
        </form>

        {/* Entries */}
        {entries.length > 0 && (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Entry
                key={entry.id}
                entry={entry}
                onDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
              />
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <p className="font-sans font-light text-farm-cream/25 text-sm">
            No entries yet — be the first.
          </p>
        )}
      </div>
    </section>
  )
}
