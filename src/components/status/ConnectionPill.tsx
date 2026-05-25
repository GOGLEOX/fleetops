import { useTelemetry } from '../../hooks/useTelemetry'

interface ConnectionPillProps {
  compact?: boolean
}

export function ConnectionPill({ compact = false }: ConnectionPillProps) {
  const { snapshot } = useTelemetry()
  const status = snapshot?.status ?? 'disconnected'
  const mockMode = snapshot?.mockMode ?? false
  const toneClass =
    status === 'connected'
      ? 'bg-emerald-500'
      : status === 'connecting'
        ? 'bg-amber-500'
        : status === 'error'
          ? 'bg-red-500'
          : 'bg-stone-500'
  const heading =
    status === 'connected'
      ? 'Online'
      : status === 'connecting'
        ? 'Connecting'
        : status === 'error'
          ? 'Error'
          : 'Offline'
  const detail =
    status === 'connected'
      ? mockMode
        ? 'Mock telemetry active'
        : 'Telemetry connected'
      : status === 'connecting'
        ? 'Telemetry handshake in progress'
        : status === 'error'
          ? 'Telemetry unavailable'
          : 'Telemetry disconnected'

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
          className={`inline-flex h-2.5 w-2.5 rounded-full ${toneClass}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            {heading}
          </p>
          <p className="text-sm text-stone-300">{detail}</p>
        </div>
      </div>
    </div>
  )
}
