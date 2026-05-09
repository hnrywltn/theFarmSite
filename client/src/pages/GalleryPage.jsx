import { useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

export default function GalleryPage() {
  const { isLoggedIn, token } = useAuth()
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)

  function loadPhotos() {
    fetch('/api/photos')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPhotos(data))
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
      await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      loadPhotos()
    } catch {}
    finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(photo, e) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${photo.name}"?`)) return
    setDeleting(photo.id)
    try {
      await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      if (selected?.id === photo.id) setSelected(null)
    } catch {}
    finally { setDeleting(null) }
  }

  return (
    <div className="font-sans bg-farm-dark min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 section-pad pt-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <p className="label-sm text-farm-gold mb-6">The Farm</p>
              <h1 className="font-serif text-4xl md:text-5xl text-farm-cream font-light">
                A Glimpse of the Land
              </h1>
            </div>
            {isLoggedIn && (
              <div className="shrink-0">
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
            )}
          </div>

          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group block">
                <button
                  onClick={() => setSelected(photo)}
                  className="w-full overflow-hidden block"
                >
                  <img
                    src={`/api/photos/${photo.id}`}
                    alt={photo.name}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>

                {photo.uploader && (
                  <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-farm-dark/75 to-transparent pointer-events-none">
                    <span className="text-farm-cream/70 text-xs">{photo.uploader}</span>
                  </div>
                )}

                {/* Delete button — appears on hover, admin only */}
                {isLoggedIn && (
                  <button
                    onClick={(e) => handleDelete(photo, e)}
                    disabled={deleting === photo.id}
                    className="absolute top-2 right-2 p-1.5 bg-farm-dark/70 text-farm-cream/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30"
                    title="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
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
          <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/photos/${selected.id}`}
              alt={selected.name}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            {selected.uploader && (
              <p className="text-farm-cream/40 text-xs tracking-wide">{selected.uploader}</p>
            )}
          </div>
          <div className="absolute top-6 right-6 flex gap-3">
            {isLoggedIn && (
              <button
                onClick={(e) => handleDelete(selected, e)}
                className="p-2 text-farm-cream/40 hover:text-red-400 transition-colors"
                title="Delete photo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
            <button
              className="p-2 text-farm-cream/40 hover:text-farm-cream transition-colors"
              onClick={() => setSelected(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
