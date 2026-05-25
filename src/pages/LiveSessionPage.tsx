import { useTelemetry } from '../hooks/useTelemetry'

export function LiveSessionPage() {
  const { snapshot, latestFrame, events } = useTelemetry()

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Live Session
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Current drive intake
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          This page reads normalized telemetry frames from the active provider
          without binding the renderer to a specific bridge implementation.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.35fr)_340px] lg:px-6 lg:py-6">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                  Connection state
                </p>
                <p className="mt-2 text-sm text-stone-200">
                  {snapshot?.status ?? 'disconnected'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                  Provider
                </p>
                <p className="mt-2 text-sm text-stone-300">
                  {snapshot?.providerId ?? '--'}
                </p>
              </div>
            </div>
            {snapshot?.lastError ? (
              <p className="mt-4 text-sm leading-6 text-red-300">
                {snapshot.lastError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Truck"
              value={
                latestFrame?.truckMake && latestFrame?.truckModel
                  ? `${latestFrame.truckMake} ${latestFrame.truckModel}`
                  : '--'
              }
            />
            <MetricCard
              label="Speed"
              value={
                latestFrame?.speedKph != null
                  ? `${latestFrame.speedKph.toFixed(0)} kph`
                  : '--'
              }
            />
            <MetricCard
              label="Fuel"
              value={
                latestFrame?.fuelLiters != null
                  ? `${latestFrame.fuelLiters.toFixed(1)} L`
                  : '--'
              }
            />
            <MetricCard
              label="Route left"
              value={
                latestFrame?.navigationDistanceKm != null
                  ? `${latestFrame.navigationDistanceKm.toFixed(1)} km`
                  : '--'
              }
            />
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Frame details
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailRow label="Game" value={latestFrame?.game ?? '--'} />
              <DetailRow
                label="Paused"
                value={latestFrame ? (latestFrame.paused ? 'Yes' : 'No') : '--'}
              />
              <DetailRow
                label="Odometer"
                value={
                  latestFrame?.odometerKm != null
                    ? `${latestFrame.odometerKm.toFixed(1)} km`
                    : '--'
                }
              />
              <DetailRow
                label="Engine"
                value={
                  latestFrame?.engineOn != null
                    ? latestFrame.engineOn
                      ? 'Running'
                      : 'Off'
                    : '--'
                }
              />
              <DetailRow
                label="RPM"
                value={
                  latestFrame?.engineRpm != null
                    ? latestFrame.engineRpm.toFixed(0)
                    : '--'
                }
              />
              <DetailRow
                label="Gear"
                value={latestFrame?.gear != null ? String(latestFrame.gear) : '--'}
              />
              <DetailRow
                label="Cargo"
                value={latestFrame?.cargoName ?? '--'}
              />
              <DetailRow
                label="Origin"
                value={latestFrame?.originCity ?? '--'}
              />
              <DetailRow
                label="Destination"
                value={latestFrame?.destinationCity ?? '--'}
              />
            </dl>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Source mode
            </p>
            <p className="mt-2 text-sm text-stone-200">
              {snapshot?.mockMode ? 'Mock telemetry' : 'Live bridge placeholder'}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              The adapter layer keeps FleetOps independent from one specific SCS
              telemetry library.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Recent events
            </p>
            <div className="mt-4 grid gap-3">
              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={`${event.timestamp}-${event.type}`}
                    className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3"
                  >
                    <p className="text-sm text-stone-200">{event.type}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/50 px-3 py-4 text-sm text-stone-500">
                  No telemetry events have been received yet.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

interface MetricCardProps {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-stone-200">{value}</p>
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3">
      <dt className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-stone-200">{value}</dd>
    </div>
  )
}
