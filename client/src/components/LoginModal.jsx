import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ onClose }) {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (login(password)) {
      onClose()
    } else {
      setError(true)
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
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            className="bg-transparent border border-farm-cream/20 text-farm-cream px-4 py-3 text-sm placeholder:text-farm-cream/30 focus:outline-none focus:border-farm-gold/50"
          />
          {error && (
            <p className="text-red-400 text-xs">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
