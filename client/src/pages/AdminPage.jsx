import Nav from '../components/Nav'
import Footer from '../components/Footer'

// ─── Placeholder sections ──────────────────────────────────────────────────────
// 1. State of the Farm — at-a-glance conditions (water, structures, fields, etc.)
// 2. Expense Log — running breakdown of costs, who paid, what for
// 3. Work Log — what's been done, what's pending, who did it
// 4. Shared Inbox — family updates so no one is out of the loop

export default function AdminPage() {
  return (
    <div className="font-sans bg-farm-dark min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 section-pad pt-32">
        <div className="max-w-5xl mx-auto">
          <p className="label-sm text-farm-gold mb-6">Admin</p>
          <h1 className="font-serif text-4xl md:text-5xl text-farm-cream font-light mb-4">
            State of the Farm
          </h1>
          <p className="font-sans font-light text-farm-cream/40 text-sm mb-16">
            Coming soon.
          </p>

          {/* Sections to build out */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Conditions', desc: 'Water, structures, fields, equipment — current state at a glance.' },
              { title: 'Expenses', desc: 'Running log of costs, who paid, what for.' },
              { title: 'Work Log', desc: 'What\'s been done, what\'s pending, who handled it.' },
              { title: 'Updates', desc: 'Shared family notes so no one is out of the loop.' },
            ].map((s) => (
              <div key={s.title} className="border border-farm-cream/10 p-6">
                <h2 className="font-serif text-xl text-farm-cream mb-2">{s.title}</h2>
                <p className="font-sans font-light text-farm-cream/40 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
