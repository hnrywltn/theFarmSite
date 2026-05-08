import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ onClose }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error)
      setPassword('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-farm-dark/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-farm-dark border border-farm-gold/20 p-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl text-farm-cream font-light mb-6">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="Email"
            autoFocus
            required
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="Password"
            required
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
