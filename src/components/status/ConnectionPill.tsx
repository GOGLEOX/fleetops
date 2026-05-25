interface ConnectionPillProps {
  compact?: boolean
}

export function ConnectionPill({ compact = false }: ConnectionPillProps) {
  return (
    <div
      className={[
        'rounded-xl border border-stone-800 bg-stone-950/75 text-stone-200',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      ].join(' ')}
      aria-label="Telemetry connection status"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-2.5 w-2.5 rounded-full bg-stone-500"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Offline
          </p>
          <p className="text-sm text-stone-300">Telemetry disconnected</p>
        </div>
      </div>
    </div>
  )
}
