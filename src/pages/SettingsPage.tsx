import { useEffect, useState } from 'react'
import type { DatabaseHealth } from '../lib/persistence/contracts'
import type { TelemetryServiceSnapshot } from '../lib/telemetry/contracts'
import {
  getDatabaseHealth,
  getTelemetrySnapshot,
  onTelemetryState,
  setMockTelemetryEnabled,
} from '../platform/ipc'

export function SettingsPage() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading',
  )
  const [telemetry, setTelemetry] = useState<TelemetryServiceSnapshot | null>(
    null,
  )
  const [telemetryBusy, setTelemetryBusy] = useState(false)

  useEffect(() => {
    let active = true

    void getDatabaseHealth()
      .then((result) => {
        if (!active) {
          return
        }

        setHealth(result)
        setStatus(result ? 'ready' : 'unavailable')
      })
      .catch(() => {
        if (active) {
          setStatus('unavailable')
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    void getTelemetrySnapshot().then((result) => {
      if (active && result) {
        setTelemetry(result)
      }
    })

    const unsubscribe = onTelemetryState((snapshot) => {
      if (active) {
        setTelemetry(snapshot)
      }
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function handleTelemetryToggle(nextEnabled: boolean) {
    setTelemetryBusy(true)

    try {
      const snapshot = await setMockTelemetryEnabled(nextEnabled)
      if (snapshot) {
        setTelemetry(snapshot)
      }
    } finally {
      setTelemetryBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Settings
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Application configuration
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Local preferences and workstation-level services will land here as the
          data and telemetry layers expand.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:px-6 lg:py-6">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Database health
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={[
                'inline-flex h-2.5 w-2.5 rounded-full',
                status === 'ready' && health?.ok ? 'bg-emerald-500' : 'bg-stone-500',
              ].join(' ')}
              aria-hidden="true"
            />
            <p className="text-sm text-stone-200">
              {status === 'loading' && 'Checking local database state'}
              {status === 'ready' && health?.ok && 'Database ready'}
              {status === 'unavailable' && 'Database status unavailable'}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HealthMetric
              label="Tables"
              value={health ? String(health.tableCount) : '--'}
            />
            <HealthMetric
              label="Migrations"
              value={health ? String(health.migrationCount) : '--'}
            />
            <HealthMetric
              label="Seed rules"
              value={health ? String(health.maintenanceRuleCount) : '--'}
            />
            <HealthMetric
              label="CRUD ready"
              value={health?.sampleCrudReady ? 'Yes' : 'No'}
            />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Telemetry
            </p>
            <p className="mt-2 text-sm text-stone-300">
              {telemetry?.status === 'connected' && telemetry.mockMode
                ? 'Mock connected'
                : telemetry?.status === 'connected'
                  ? 'Connected'
                  : telemetry?.status === 'connecting'
                    ? 'Connecting'
                    : telemetry?.status === 'error'
                      ? 'Provider unavailable'
                      : 'Disconnected'}
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-stone-200">
                  Mock telemetry mode
                </span>
                <span className="block text-xs leading-5 text-stone-500">
                  Use development frames instead of a live bridge.
                </span>
              </span>
              <button
                type="button"
                aria-pressed={telemetry?.mockMode ?? false}
                disabled={telemetryBusy}
                onClick={() =>
                  void handleTelemetryToggle(!(telemetry?.mockMode ?? false))
                }
                className={[
                  'relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors',
                  telemetry?.mockMode
                    ? 'border-amber-600 bg-amber-500/20'
                    : 'border-stone-700 bg-stone-950',
                  telemetryBusy ? 'opacity-60' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-5 w-5 rounded-full bg-stone-200 transition-transform',
                    telemetry?.mockMode ? 'translate-x-8' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </label>
            {telemetry?.lastError ? (
              <p className="mt-3 text-xs leading-5 text-red-300">
                {telemetry.lastError}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              No cloud sync, no save import, and no database-driven UI editing
              are being added in this phase.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

interface HealthMetricProps {
  label: string
  value: string
}

function HealthMetric({ label, value }: HealthMetricProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/75 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-stone-200">{value}</p>
    </div>
  )
}
