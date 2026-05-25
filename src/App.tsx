function App() {
  const moduleCards = [
    {
      title: 'Telemetry intake',
      status: 'Foundation',
      detail:
        'Bridge ATS session, truck, route, and fuel signals into normalized local records.',
    },
    {
      title: 'Trip ledger',
      status: 'Planned',
      detail:
        'Turn driving sessions into auditable trip records with manual correction when telemetry is incomplete.',
    },
    {
      title: 'Asset registry',
      status: 'Planned',
      detail:
        'Track trucks, garages, and ownership history without claiming full company import.',
    },
    {
      title: 'Maintenance and finance',
      status: 'Planned',
      detail:
        'Capture service events, running costs, and practical ledger entries for single-player operations.',
    },
  ]

  const boundaryPoints = [
    'Local-first data flow with SQLite persistence',
    'No save editing, no cloud account model, no ATS memory manipulation',
    'Telemetry-assisted tracking with explicit manual correction paths',
    'Extension seams reserved for reports, exports, and future parsers',
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(179,94,31,0.16),_transparent_34%),linear-gradient(180deg,_#121416_0%,_#0b0d0f_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="border-b border-stone-800 pb-6">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-500">
            FleetOps Desktop
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-['Bahnschrift','DIN_Alternate','Segoe_UI',sans-serif] text-4xl tracking-[0.08em] text-stone-50 sm:text-5xl">
                Carrier operations terminal for ATS sessions
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                A local-first desktop companion that listens to ATS telemetry and
                turns sessions into practical operational records without
                pretending it can automatically know the entire company state.
              </p>
            </div>
            <div className="grid min-w-[280px] gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 p-4 text-sm shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Stage</span>
                <span className="rounded-full border border-amber-700/60 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-amber-300">
                  Foundation
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Runtime</span>
                <span>Electron + React</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Persistence</span>
                <span>SQLite planned</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h2 className="text-lg font-semibold tracking-[0.16em] text-stone-100 uppercase">
                Current shell
              </h2>
              <span className="text-xs uppercase tracking-[0.3em] text-stone-500">
                Placeholder UI
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {moduleCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-stone-100">
                      {card.title}
                    </h3>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-amber-400">
                      {card.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-400">
                    {card.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-800 bg-stone-900/55 p-6">
            <h2 className="text-lg font-semibold uppercase tracking-[0.16em] text-stone-100">
              Operating boundaries
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-stone-300">
              {boundaryPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3"
                >
                  {point}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-auto grid gap-4 border-t border-stone-800 pt-6 text-sm text-stone-400 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Next
            </p>
            <p className="mt-2">Wire SQLite persistence, telemetry adapter seams, and trip session intake.</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              MVP truth
            </p>
            <p className="mt-2">Auto-detect the active truck when telemetry allows it; use manual records elsewhere.</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Docs
            </p>
            <p className="mt-2">See the project README and the docs folder for scope, phases, and telemetry constraints.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
