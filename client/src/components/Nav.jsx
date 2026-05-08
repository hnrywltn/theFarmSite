import { useState } from 'react'

export default function Nav() {
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'About', href: '#about' },
    { label: 'The Land', href: '#the-land' },
    { label: 'Gallery', href: '/gallery' },
    // { label: 'Contact', href: '#contact' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-farm-dark/90 backdrop-blur-sm border-b border-farm-gold/10">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 h-16">
        <a href="/" className="font-serif text-farm-cream text-lg tracking-wide">
          Nana &amp; Papa's Farm
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="nav-link label-sm text-farm-cream/70 hover:text-farm-cream transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-farm-cream/70 hover:text-farm-cream"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-farm-dark border-t border-farm-gold/10 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="label-sm text-farm-cream/70 hover:text-farm-cream transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
