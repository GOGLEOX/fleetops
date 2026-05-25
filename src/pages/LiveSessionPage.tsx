import { useSessionTracking } from '../hooks/useSessionTracking'

export function LiveSessionPage() {
  const {
    snapshot,
    registerPendingTruck,
    ignorePendingTruck,
    deferPendingTruck,
  } = useSessionTracking()
  const frame = snapshot?.latestFrame

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Live Session
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Active operational session
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Session tracking converts normalized telemetry into conservative trip,
          truck, fuel, and idle records without pretending certainty where the
          bridge cannot provide it.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.35fr)_340px] lg:px-6 lg:py-6">
        <div className="grid gap-4">
          {snapshot?.newTruckPrompt ? (
            <section className="rounded-2xl border border-amber-700/50 bg-amber-500/8 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
                New truck detected
              </p>
              <p className="mt-2 text-sm text-stone-100">
                {snapshot.newTruckPrompt.detectedMake ?? 'Unknown make'}{' '}
                {snapshot.newTruckPrompt.detectedModel ?? 'Unknown model'}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                FleetOps created a pending detected truck record from telemetry.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton
                  label="Register"
                  onClick={() =>
                    void registerPendingTruck(snapshot.newTruckPrompt!.truckId)
                  }
                />
                <ActionButton
                  label="Ignore"
                  onClick={() =>
                    void ignorePendingTruck(snapshot.newTruckPrompt!.truckId)
                  }
                  tone="secondary"
                />
                <ActionButton
                  label="Later"
                  onClick={() =>
                    void deferPendingTruck(snapshot.newTruckPrompt!.truckId)
                  }
                  tone="secondary"
                />
              </div>
            </section>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Session"
              value={snapshot?.sessionState ?? 'idle'}
            />
            <MetricCard
              label="Trip"
              value={snapshot?.activeTrip ? snapshot.activeTrip.status : '--'}
            />
            <MetricCard
              label="Fuel used"
              value={
                snapshot?.activeSession
                  ? `${snapshot.activeSession.fuelUsedGal.toFixed(2)} gal`
                  : '--'
              }
            />
            <MetricCard
              label="Idle"
              value={
                snapshot?.activeSession
                  ? `${snapshot.activeSession.idleMinutes.toFixed(1)} min`
                  : '--'
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Truck"
              value={snapshot?.activeTruck?.displayName ?? '--'}
            />
            <MetricCard
              label="Distance"
              value={
                snapshot?.activeSession
                  ? `${snapshot.activeSession.distanceMi.toFixed(2)} mi`
                  : '--'
              }
            />
            <MetricCard
              label="Fuel tank"
              value={
                frame?.fuelLiters != null
                  ? `${frame.fuelLiters.toFixed(1)} L`
                  : '--'
              }
            />
            <MetricCard
              label="Speed"
              value={
                frame?.speedKph != null ? `${frame.speedKph.toFixed(0)} kph` : '--'
              }
            />
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Active trip
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailRow
                label="Cargo"
                value={snapshot?.activeTrip?.cargoName ?? '--'}
              />
              <DetailRow
                label="Origin"
                value={snapshot?.activeTrip?.originCity ?? '--'}
              />
              <DetailRow
                label="Destination"
                value={snapshot?.activeTrip?.destinationCity ?? '--'}
              />
              <DetailRow
                label="Revenue"
                value={
                  snapshot?.activeTrip?.revenueCents != null
                    ? `$${(snapshot.activeTrip.revenueCents / 100).toFixed(2)}`
                    : '--'
                }
              />
              <DetailRow
                label="Damage"
                value={
                  snapshot?.activeTrip?.damageEnd != null
                    ? `${(snapshot.activeTrip.damageEnd * 100).toFixed(1)}%`
                    : '--'
                }
              />
              <DetailRow
                label="Close mode"
                value={snapshot?.inferredTrip ? 'Inferred' : 'Direct'}
              />
            </dl>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Session notes
            </p>
            <p className="mt-2 text-sm text-stone-200">
              {snapshot?.lastDecisionNote ?? 'No operator action recorded.'}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Missing job-end certainty falls back to conservative inferred trip
              closure instead of fabricated certainty.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Latest refuel
            </p>
            {snapshot?.recentFuelEvent ? (
              <div className="mt-3 rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3">
                <p className="text-sm text-stone-200">
                  {snapshot.recentFuelEvent.gallons.toFixed(2)} gal detected
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(snapshot.recentFuelEvent.occurredAt).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-stone-700 bg-stone-900/50 px-3 py-4 text-sm text-stone-500">
                No refuel event detected in this session.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Telemetry state
            </p>
            <p className="mt-2 text-sm text-stone-200">
              {snapshot?.telemetryStatus ?? 'disconnected'}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Active frame values are updated from the provider layer, while
              persistent records are written by the session engine.
            </p>
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

interface ActionButtonProps {
  label: string
  onClick: () => void
  tone?: 'primary' | 'secondary'
}

function ActionButton({
  label,
  onClick,
  tone = 'primary',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl border px-4 py-2 text-sm transition-colors',
        tone === 'primary'
          ? 'border-amber-600 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
          : 'border-stone-700 bg-stone-900/70 text-stone-200 hover:bg-stone-800',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
