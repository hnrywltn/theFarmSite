import { useInView } from '../hooks/useInView'

export default function About() {
  const [ref, inView] = useInView()

  return (
    <section id="about" className="section-pad bg-farm-dark">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <p className="label-sm text-farm-gold mb-6">Our Story</p>

        <h2 className="font-serif text-4xl md:text-5xl text-farm-cream font-light leading-snug mb-8">
          Charles &amp; Elaine Walton
        </h2>

        <div className="space-y-5 font-sans font-light text-farm-cream/70 leading-relaxed text-base md:text-lg">
          <p>
            Charles built the original farmhouse himself — pulling boulders out of the ground with
            a tractor and laying them as the foundation. The land had cows, rabbits, horses, and
            enough room to get into trouble.
          </p>
          <p>
            The farmhouse is gone now, but the land isn't. There's a cabin in the field, and the
            family still comes back to it.
          </p>
          <p>
            Elaine and Charles are buried a few miles up the road at Wesley Chapel, on a hill.
          </p>
        </div>
      </div>
    </section>
  )
}
