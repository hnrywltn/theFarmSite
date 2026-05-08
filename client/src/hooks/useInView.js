import { useCallback, useRef, useState } from 'react'

// Fires once when element enters the viewport, then disconnects.
export function useInView(threshold = 0.12) {
  const [inView, setInView] = useState(false)
  const obsRef = useRef(null)

  const ref = useCallback(
    (node) => {
      if (obsRef.current) {
        obsRef.current.disconnect()
        obsRef.current = null
      }
      if (!node) return
      obsRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            obsRef.current?.disconnect()
          }
        },
        { threshold }
      )
      obsRef.current.observe(node)
    },
    [threshold]
  )

  return [ref, inView]
}
