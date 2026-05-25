import { useMemo, useState } from 'react'
import { useMaintenance } from '../hooks/useMaintenance'
import type {
  MaintenanceDueStatus,
  MaintenanceEventInput,
  MaintenanceRuleInput,
  TruckMaintenanceStatus,
} from '../lib/maintenance/contracts'
import type { MaintenanceRuleRecord } from '../lib/persistence/contracts'

export function MaintenancePage() {
  const {
    snapshot,
    selectedTruckId,
    selectedTruckDetail,
    selectTruck,
    saveMaintenanceRule,
    logMaintenanceEvent,
  } = useMaintenance()
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Maintenance
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Service planning
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Mileage-based upkeep planning for active trucks with due soon warnings,
          service history, and cost tracking that stays helpful instead of punitive.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)] xl:px-6 xl:py-6">
        <div className="min-w-0 rounded-2xl border border-stone-800 bg-stone-950/55">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Service board
            </p>
            <button
              type="button"
              onClick={() => setShowRuleEditor((current) => !current)}
              className="rounded-xl border border-stone-700 bg-stone-900/80 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800"
            >
              {showRuleEditor ? 'Close rules' : 'Edit rules'}
            </button>
          </div>

          {showRuleEditor && snapshot ? (
            <RuleEditor
              rules={snapshot.rules}
              onSave={saveMaintenanceRule}
            />
          ) : null}

          <div className="grid gap-4 p-4">
            <StatusGroup
              title="Due Now"
              status="due_now"
              items={snapshot?.dueNow ?? []}
              selectedTruckId={selectedTruckId}
              onSelectTruck={selectTruck}
            />
            <StatusGroup
              title="Due Soon"
              status="due_soon"
              items={snapshot?.dueSoon ?? []}
              selectedTruckId={selectedTruckId}
              onSelectTruck={selectTruck}
            />
            <StatusGroup
              title="Current"
              status="current"
              items={snapshot?.current ?? []}
              selectedTruckId={selectedTruckId}
              onSelectTruck={selectTruck}
            />
          </div>
        </div>

        <div className="min-w-0">
          {selectedTruckDetail ? (
            <div className="grid gap-4">
              <section className="rounded-2xl border border-stone-800 bg-stone-950/55">
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-4 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                      Truck-specific maintenance history
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-stone-100">
                      {selectedTruckDetail.truck.displayName}
                    </h4>
                    <p className="mt-2 text-sm text-stone-400">
                      Odometer {formatMiles(selectedTruckDetail.truck.currentOdometerMi ?? selectedTruckDetail.truck.startingOdometerMi ?? 0)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEventForm((current) => !current)}
                    className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25"
                  >
                    {showEventForm ? 'Close entry' : 'Add maintenance event'}
                  </button>
                </div>

                {showEventForm ? (
                  <MaintenanceEventForm
                    detail={selectedTruckDetail}
                    rules={snapshot?.rules ?? []}
                    onSave={async (input) => {
                      await logMaintenanceEvent(input)
                      setShowEventForm(false)
                    }}
                  />
                ) : null}

                <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatTile
                    label="Due now"
                    value={String(
                      selectedTruckDetail.statuses.filter(
                        (status) => status.status === 'due_now',
                      ).length,
                    )}
                  />
                  <StatTile
                    label="Due soon"
                    value={String(
                      selectedTruckDetail.statuses.filter(
                        (status) => status.status === 'due_soon',
                      ).length,
                    )}
                  />
                  <StatTile
                    label="Current"
                    value={String(
                      selectedTruckDetail.statuses.filter(
                        (status) => status.status === 'current',
                      ).length,
                    )}
                  />
                  <StatTile
                    label="Completed history"
                    value={String(selectedTruckDetail.history.length)}
                  />
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <ServiceProjectionPanel statuses={selectedTruckDetail.statuses} />
                <CostTrackingPanel detail={selectedTruckDetail} />
              </div>

              <HistorySection
                title="Due list"
                emptyLabel="No active maintenance rules are attached to this truck."
                rows={selectedTruckDetail.statuses.map((status) => ({
                  id: `${status.truck.id}-${status.rule.id}`,
                  primary: status.rule.name,
                  secondary: `${formatStatusLabel(status.status)} • ${status.progressPercent.toFixed(0)}% of interval`,
                  meta: `${formatMiles(status.milesSinceService)} since service • next due ${formatMiles(status.nextDueOdometerMi)}`,
                }))}
              />

              <HistorySection
                title="Completed history"
                emptyLabel="No maintenance events recorded for this truck yet."
                rows={selectedTruckDetail.history.map((entry) => ({
                  id: entry.event.id,
                  primary: entry.rule?.name ?? 'Manual maintenance service',
                  secondary: new Date(entry.event.performedAt).toLocaleDateString(),
                  meta: `${formatMiles(entry.event.odometerMi)} • ${formatCurrency(entry.financeEntry?.amountCents ?? entry.event.costCents ?? 0)}`,
                }))}
              />
            </div>
          ) : (
            <EmptyStateBlock
              title="Select a truck"
              detail="Choose a truck from the service board to review due work, projections, and completed maintenance history."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function RuleEditor({
  rules,
  onSave,
}: {
  rules: MaintenanceRuleRecord[]
  onSave: (input: MaintenanceRuleInput) => Promise<MaintenanceRuleRecord | null>
}) {
  const [drafts, setDrafts] = useState(
    rules.map((rule) => ({
      ...rule,
      intervalEngineHours: rule.intervalEngineHours?.toString() ?? '',
    })),
  )

  return (
    <div className="grid gap-3 border-b border-stone-800 px-4 py-4">
      {drafts.map((draft, index) => (
        <div
          key={draft.id}
          className="grid gap-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-3 md:grid-cols-[minmax(0,1.2fr)_140px_140px_120px]"
        >
          <Field
            label="Rule"
            value={draft.name}
            onChange={(value) =>
              setDrafts((current) =>
                current.map((item, currentIndex) =>
                  currentIndex === index ? { ...item, name: value } : item,
                ),
              )
            }
            placeholder="Oil service"
          />
          <Field
            label="Miles"
            value={String(draft.intervalMiles)}
            onChange={(value) =>
              setDrafts((current) =>
                current.map((item, currentIndex) =>
                  currentIndex === index
                    ? { ...item, intervalMiles: Number(value) || 0 }
                    : item,
                ),
              )
            }
            placeholder="15000"
          />
          <Field
            label="Engine hrs"
            value={draft.intervalEngineHours}
            onChange={(value) =>
              setDrafts((current) =>
                current.map((item, currentIndex) =>
                  currentIndex === index
                    ? { ...item, intervalEngineHours: value }
                    : item,
                ),
              )
            }
            placeholder="Optional"
          />
          <ToggleField
            label="Enabled"
            value={draft.enabled}
            onChange={(value) =>
              setDrafts((current) =>
                current.map((item, currentIndex) =>
                  currentIndex === index ? { ...item, enabled: value } : item,
                ),
              )
            }
          />
          <div className="md:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                void onSave({
                  ruleId: draft.id,
                  name: draft.name,
                  intervalMiles: draft.intervalMiles,
                  intervalEngineHours: parseOptionalNumber(draft.intervalEngineHours),
                  enabled: draft.enabled,
                })
              }
              className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800"
            >
              Save rule
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MaintenanceEventForm({
  detail,
  rules,
  onSave,
}: {
  detail: { truck: { id: string; currentOdometerMi: number | null; engineHours: number | null }; statuses: TruckMaintenanceStatus[] }
  rules: MaintenanceRuleRecord[]
  onSave: (input: MaintenanceEventInput) => Promise<void>
}) {
  const [ruleId, setRuleId] = useState(detail.statuses[0]?.rule.id ?? rules[0]?.id ?? '')
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString())
  const [odometerMi, setOdometerMi] = useState(
    String(Math.round(detail.truck.currentOdometerMi ?? 0)),
  )
  const [engineHours, setEngineHours] = useState(
    detail.truck.engineHours != null ? detail.truck.engineHours.toFixed(1) : '',
  )
  const [costCents, setCostCents] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="grid gap-4 border-b border-stone-800 px-4 py-4 md:grid-cols-2">
      <SelectField
        label="Rule"
        value={ruleId}
        onChange={setRuleId}
        options={rules.map((rule) => ({ value: rule.id, label: rule.name }))}
      />
      <Field
        label="Performed at"
        value={performedAt}
        onChange={setPerformedAt}
        placeholder="2026-05-25T12:00:00.000Z"
      />
      <Field
        label="Odometer"
        value={odometerMi}
        onChange={setOdometerMi}
        placeholder="152300"
      />
      <Field
        label="Engine hours"
        value={engineHours}
        onChange={setEngineHours}
        placeholder="Optional"
      />
      <Field
        label="Cost ($)"
        value={costCents}
        onChange={setCostCents}
        placeholder="325.00"
      />
      <TextAreaField
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Service note"
      />
      <div className="md:col-span-2 flex justify-end">
        <button
          type="button"
          onClick={() =>
            void onSave({
              truckId: detail.truck.id,
              ruleId: ruleId || null,
              performedAt,
              odometerMi: Number(odometerMi) || 0,
              engineHours: parseOptionalNumber(engineHours),
              costCents: parseCurrencyInput(costCents),
              notes: notes.trim() || null,
            })
          }
          className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25"
        >
          Log event
        </button>
      </div>
    </div>
  )
}

function ServiceProjectionPanel({
  statuses,
}: {
  statuses: TruckMaintenanceStatus[]
}) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Service interval projections
      </p>
      <div className="mt-4 grid gap-3">
        {statuses.map((status) => (
          <div
            key={status.rule.id}
            className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-200">
                  {status.rule.name}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Next due at {formatMiles(status.nextDueOdometerMi)}
                </p>
              </div>
              <StatusPill status={status.status} />
            </div>
            <p className="mt-3 text-sm text-stone-300">
              {status.milesUntilDue >= 0
                ? `${formatMiles(status.milesUntilDue)} remaining`
                : `${formatMiles(Math.abs(status.milesUntilDue))} overdue`}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CostTrackingPanel({
  detail,
}: {
  detail: { history: Array<{ financeEntry: { amountCents: number } | null }> }
}) {
  const totalCost = useMemo(
    () =>
      detail.history.reduce(
        (sum, entry) => sum + Math.abs(entry.financeEntry?.amountCents ?? 0),
        0,
      ),
    [detail.history],
  )

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Maintenance cost tracking
      </p>
      <div className="mt-4 grid gap-3">
        <StatTile label="Posted costs" value={formatCurrency(-totalCost)} />
        <StatTile label="Logged events" value={String(detail.history.length)} />
      </div>
    </section>
  )
}

function StatusGroup({
  title,
  status,
  items,
  selectedTruckId,
  onSelectTruck,
}: {
  title: string
  status: MaintenanceDueStatus
  items: TruckMaintenanceStatus[]
  selectedTruckId: string | null
  onSelectTruck: (truckId: string) => void
}) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900/50">
      <div className="border-b border-stone-800 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{title}</p>
      </div>
      {items.length ? (
        <div className="grid gap-3 p-4">
          {items.map((item) => (
            <button
              key={`${item.truck.id}-${item.rule.id}`}
              type="button"
              onClick={() => onSelectTruck(item.truck.id)}
              className={[
                'rounded-2xl border px-4 py-4 text-left transition-colors',
                selectedTruckId === item.truck.id
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-stone-800 bg-stone-900/70 hover:bg-stone-900',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-100">
                    {item.truck.displayName}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{item.rule.name}</p>
                </div>
                <StatusPill status={status} />
              </div>
              <p className="mt-3 text-sm text-stone-300">
                {formatMiles(item.milesSinceService)} since service
              </p>
            </button>
          ))}
        </div>
      ) : (
        <EmptyStateBlock
          title={title}
          detail={`No ${title.toLowerCase()} maintenance items right now.`}
          compact
        />
      )}
    </section>
  )
}

function HistorySection({
  title,
  rows,
  emptyLabel,
}: {
  title: string
  rows: Array<{ id: string; primary: string; secondary: string; meta: string }>
  emptyLabel: string
}) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{title}</p>
      {rows.length ? (
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3"
            >
              <p className="text-sm font-medium text-stone-200">{row.primary}</p>
              <p className="mt-1 text-xs text-stone-500">{row.secondary}</p>
              <p className="mt-2 text-xs text-stone-400">{row.meta}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateBlock title={title} detail={emptyLabel} compact />
      )}
    </section>
  )
}

function StatusPill({ status }: { status: MaintenanceDueStatus }) {
  const classes =
    status === 'due_now'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : status === 'due_soon'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${classes}`}>
      {formatStatusLabel(status)}
    </span>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-2 text-base text-stone-200">{value}</p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-left text-sm text-stone-100"
      >
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600"
      />
    </label>
  )
}

function EmptyStateBlock({
  title,
  detail,
  compact = false,
}: {
  title: string
  detail: string
  compact?: boolean
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 text-stone-400',
        compact ? 'mt-4 px-4 py-4' : 'm-4 px-4 py-5',
      ].join(' ')}
    >
      <p className="text-sm font-medium text-stone-300">{title}</p>
      <p className="mt-2 text-sm leading-6">{detail}</p>
    </div>
  )
}

function formatStatusLabel(status: MaintenanceDueStatus): string {
  switch (status) {
    case 'due_now':
      return 'Due Now'
    case 'due_soon':
      return 'Due Soon'
    case 'current':
      return 'Current'
  }
}

function formatMiles(value: number): string {
  return `${value.toFixed(0)} mi`
}

function formatCurrency(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(amountCents) / 100).toFixed(2)}`
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseCurrencyInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null
}
