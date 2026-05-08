import { useInView } from '../hooks/useInView'

const features = [
  {
    label: 'The Cabin',
    description: 'A clearing in the Appalachian woods.',
  },
  {
    label: 'The Bottoms & The Long Fields',
    description: 'Two stretches of open land with their own character, names the family has always used.',
  },
  {
    label: 'Buck Creek',
    description: 'Clear Appalachian water that runs along the edge of the property, fed by limestone springs and caves.',
  },
]

export default function TheLand() {
  const [ref, inView] = useInView()

  return (
    <section id="the-land" className="section-pad bg-farm-green/10">
      <div ref={ref} className="max-w-5xl mx-auto">
        <p
          className={`label-sm text-farm-gold mb-6 transition-all duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          The Land
        </p>

        <h2
          className={`font-serif text-4xl md:text-5xl text-farm-cream font-light leading-snug mb-16 transition-all duration-700 delay-100 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          Three Hundred Acres
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <div
              key={f.label}
              className={`transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: inView ? `${i * 120 + 200}ms` : '0ms' }}
            >
              <div className="h-px bg-farm-gold/40 mb-6" />
              <h3 className="font-serif text-xl text-farm-cream mb-3">{f.label}</h3>
              <p className="font-sans font-light text-farm-cream/60 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
