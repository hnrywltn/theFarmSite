import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'

export default function Photos() {
  const [ref, inView] = useInView()
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/photos')
      .then((r) => r.json())
      .then((files) => setPhotos(files))
      .catch(() => {})
  }, [])

  if (photos.length === 0) return null

  return (
    <section id="photos" className="section-pad bg-farm-dark">
      <div ref={ref} className="max-w-6xl mx-auto">
        <p
          className={`label-sm text-farm-gold mb-6 transition-all duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          The Farm
        </p>
        <h2
          className={`font-serif text-4xl md:text-5xl text-farm-cream font-light mb-12 transition-all duration-700 delay-100 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          A Glimpse of the Land
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelected(photo)}
              className={`relative aspect-square overflow-hidden group transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: inView ? `${i * 60 + 200}ms` : '0ms' }}
            >
              <img
                src={`/api/photos/${photo.id}`}
                alt={photo.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-farm-dark/95 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <img
            src={`/api/photos/${selected.id}`}
            alt={selected.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-farm-cream/50 hover:text-farm-cream transition-colors"
            onClick={() => setSelected(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
