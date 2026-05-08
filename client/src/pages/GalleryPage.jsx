import { useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  function loadPhotos() {
    fetch('/api/photos')
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {})
  }

  useEffect(() => { loadPhotos() }, [])

  async function handleUpload(e) {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const formData = new FormData()
    for (const file of files) formData.append('photos', file)

    try {
      await fetch('/api/photos/upload', { method: 'POST', body: formData })
      loadPhotos()
    } catch {
      // silent fail — Drive will have it or won't
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="font-sans bg-farm-dark min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 section-pad pt-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-sm text-farm-gold mb-6">The Farm</p>
              <h1 className="font-serif text-4xl md:text-5xl text-farm-cream font-light">
                A Glimpse of the Land
              </h1>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="label-sm text-farm-gold border border-farm-gold/40 px-6 py-3 hover:bg-farm-gold/10 transition-colors disabled:opacity-40"
              >
                {uploading ? 'Uploading…' : '+ Add Photos'}
              </button>
            </div>
          </div>

          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="w-full overflow-hidden group block"
              >
                <img
                  src={`/api/photos/${photo.id}`}
                  alt={photo.name}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />

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
    </div>
  )
}
