import { useEffect, useState } from 'react'

function CollageStrip({ photos, className }) {
  const doubled = [...photos, ...photos]
  return (
    <div className="overflow-hidden w-full">
      <div className={`flex gap-3 w-max ${className}`}>
        {doubled.map((photo, i) => (
          <div key={`${photo.id}-${i}`} className="h-48 w-72 flex-shrink-0 overflow-hidden">
            <img
              src={`/api/photos/${photo.id}`}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Hero() {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    fetch('/api/photos')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPhotos(data))
      .catch(() => {})
  }, [])

  const row1 = photos.filter((_, i) => i % 3 === 0)
  const row2 = photos.filter((_, i) => i % 3 === 1)
  const row3 = photos.filter((_, i) => i % 3 === 2)

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-farm-dark">

      {/* Collage background */}
      {photos.length > 0 && (
        <div className="absolute inset-0 flex flex-col justify-center gap-3 opacity-40 pointer-events-none select-none">
          {row1.length > 0 && <CollageStrip photos={row1} className="collage-left" />}
          {row2.length > 0 && <CollageStrip photos={row2} className="collage-right" />}
          {row3.length > 0 && <CollageStrip photos={row3} className="collage-left-slow" />}
        </div>
      )}

      {/* Hero text with solid background */}
      <div className="relative z-10 text-center px-12 py-14 bg-farm-dark animate-fade-in">
        <p className="label-sm text-farm-gold tracking-[0.4em] mb-6">Buck Creek · Kentucky</p>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-farm-cream font-light leading-tight">
          Nana &amp; Papa's
          <br />
          <em>Farm</em>
        </h1>

        <p className="mt-8 font-sans font-light text-farm-cream/60 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          Three hundred acres of Appalachian Kentucky, built by hand and filled with memory.
        </p>

        <div className="mt-12 flex items-center justify-center gap-6">
          <a
            href="#about"
            className="label-sm text-farm-gold border border-farm-gold/40 px-8 py-3 hover:bg-farm-gold/10 transition-colors"
          >
            Our Story
          </a>
          <a
            href="/gallery"
            className="label-sm text-farm-cream/60 hover:text-farm-cream transition-colors"
          >
            View Gallery →
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-5 h-5 text-farm-gold/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
