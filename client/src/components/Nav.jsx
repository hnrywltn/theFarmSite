import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'

export default function Nav() {
  const { isLoggedIn, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const links = [
    { label: 'About', href: '#about' },
    { label: 'The Land', href: '#the-land' },
    { label: 'Gallery', href: '/gallery' },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-farm-dark/90 backdrop-blur-sm border-b border-farm-gold/10">
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 h-16">
          <a href="/" className="font-serif text-farm-cream text-lg tracking-wide">
            Nana &amp; Papa's Farm
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
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
            {isLoggedIn ? (
              <>
                <li>
                  <a
                    href="/admin"
                    className="nav-link label-sm text-farm-gold/80 hover:text-farm-gold transition-colors"
                  >
                    Admin
                  </a>
                </li>
                <li>
                  <button
                    onClick={logout}
                    className="label-sm text-farm-cream/40 hover:text-farm-cream transition-colors"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="label-sm text-farm-cream/50 hover:text-farm-cream transition-colors"
                >
                  Sign In
                </button>
              </li>
            )}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-farm-cream/70 hover:text-farm-cream p-2 -mr-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-farm-dark border-t border-farm-gold/10 px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="label-sm text-farm-cream/70 hover:text-farm-cream transition-colors"
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <>
                <a
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="label-sm text-farm-gold/80 hover:text-farm-gold transition-colors"
                >
                  Admin
                </a>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="label-sm text-farm-cream/40 hover:text-farm-cream transition-colors text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setLoginOpen(true); setMenuOpen(false) }}
                className="label-sm text-farm-cream/50 hover:text-farm-cream transition-colors text-left"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  )
}
