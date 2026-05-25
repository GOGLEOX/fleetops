interface EmptyStateCardProps {
  section: string
  summary: string
  detail: string
}

export function EmptyStateCard({
  section,
  summary,
  detail,
}: EmptyStateCardProps) {
  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          {section}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          {summary}
        </h3>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_280px] lg:px-6 lg:py-6">
        <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-950/65 p-5">
          <p className="text-sm leading-7 text-stone-300">{detail}</p>
          <p className="mt-5 text-sm leading-7 text-stone-500">
            No live telemetry, persistence, or operational records are required
            for this shell state.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              State
            </p>
            <p className="mt-2 text-sm text-stone-300">Empty</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Operator note
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              This section is ready for future implementation without synthetic
              placeholder data.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
