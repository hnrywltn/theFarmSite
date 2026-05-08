import { useInView } from '../hooks/useInView'

export default function Footer() {
  const [ref, inView] = useInView()

  return (
    <footer className="bg-farm-dark border-t border-farm-gold/10 px-6 md:px-12 lg:px-24 py-10" ref={ref}>
      <div
        className={`flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <p className="font-serif text-farm-cream/50 text-sm">
          Nana &amp; Papa's Farm &mdash; Buck Creek, Kentucky
        </p>
        <p className="font-sans text-xs text-farm-cream/20">
          &copy; {new Date().getFullYear()} Family Trust
        </p>
        <p className="font-sans text-xs text-farm-cream/20">
          Designed by{' '}
          <a
            href="https://lightpatternsonline.com/#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-farm-cream/40 transition-colors"
          >
            Light Patterns
          </a>
        </p>
      </div>
    </footer>
  )
}
