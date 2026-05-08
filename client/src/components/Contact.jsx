import { useState } from 'react'
import { useInView } from '../hooks/useInView'

export default function Contact() {
  const [ref, inView] = useInView()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full bg-transparent border border-farm-cream/20 text-farm-cream placeholder:text-farm-cream/30 px-4 py-3 text-sm font-sans font-light focus:outline-none focus:border-farm-gold/60 transition-colors'

  return (
    <section id="contact" className="section-pad bg-farm-dark">
      <div
        ref={ref}
        className={`max-w-xl mx-auto transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <p className="label-sm text-farm-gold mb-6">Get in Touch</p>
        <h2 className="font-serif text-4xl text-farm-cream font-light mb-10">Contact</h2>

        {status === 'success' ? (
          <p className="font-sans font-light text-farm-cream/70 text-sm">
            Thanks — we'll be in touch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
            <textarea
              name="message"
              placeholder="Message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className={inputClass + ' resize-none'}
            />
            {status === 'error' && (
              <p className="text-red-400 text-xs font-sans">Something went wrong — try again.</p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="label-sm text-farm-gold border border-farm-gold/40 px-8 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
