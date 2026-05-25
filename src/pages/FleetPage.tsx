import { useMemo, useState } from 'react'
import type {
  FleetTruckDetail,
  RegisterDetectedTruckInput,
  UpdateTruckInput,
} from '../lib/fleet/contracts'
import type { TruckRecord } from '../lib/persistence/contracts'
import { useFleet } from '../hooks/useFleet'

export function FleetPage() {
  const {
    snapshot,
    selectedTruckId,
    selectedTruckDetail,
    selectTruck,
    registerDetectedTruck,
    updateTruck,
  } = useFleet()
  const [dismissedPendingTruckId, setDismissedPendingTruckId] = useState<
    string | null
  >(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const pendingTruck = snapshot?.pendingTruck ?? null
  const showRegistrationModal =
    pendingTruck != null && pendingTruck.id !== dismissedPendingTruckId

  return (
    <>
      <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
        <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
            Fleet
          </p>
          <h3 className="mt-2 text-xl font-semibold text-stone-100">
            Truck registry
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            A practical view of active units, detected trucks, and the operating
            record around each truck without turning the workflow into office software.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)] xl:px-6 xl:py-6">
          <div className="min-w-0 rounded-2xl border border-stone-800 bg-stone-950/55">
            <div className="border-b border-stone-800 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Fleet list
              </p>
            </div>
            {snapshot?.trucks.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-stone-800 text-xs uppercase tracking-[0.22em] text-stone-500">
                    <tr>
                      <HeaderCell label="Truck" />
                      <HeaderCell label="Make/model" />
                      <HeaderCell label="Status" />
                      <HeaderCell label="Odometer" />
                      <HeaderCell label="MPG" />
                      <HeaderCell label="Idle" />
                      <HeaderCell label="Last seen" />
                      <HeaderCell label="Maintenance" />
                      <HeaderCell label="Net profit" />
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.trucks.map((item) => (
                      <tr
                        key={item.truck.id}
                        className={[
                          'cursor-pointer border-b border-stone-900/70 transition-colors hover:bg-stone-900/80',
                          selectedTruckId === item.truck.id
                            ? 'bg-amber-500/10'
                            : '',
                        ].join(' ')}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTruckId === item.truck.id}
                        onClick={() => selectTruck(item.truck.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectTruck(item.truck.id)
                          }
                        }}
                      >
                        <BodyCell value={item.truck.displayName} strong />
                        <BodyCell
                          value={`${item.truck.detectedMake ?? '--'} ${item.truck.detectedModel ?? ''}`.trim()}
                        />
                        <BodyCell value={formatStatus(item.truck.status)} />
                        <BodyCell
                          value={
                            item.truck.currentOdometerMi != null
                              ? `${item.truck.currentOdometerMi.toFixed(0)} mi`
                              : '--'
                          }
                        />
                        <BodyCell
                          value={item.avgMpg != null ? item.avgMpg.toFixed(1) : '--'}
                        />
                        <BodyCell
                          value={
                            item.truck.idleHours != null
                              ? item.truck.idleHours.toFixed(1)
                              : '--'
                          }
                        />
                        <BodyCell value={item.lastSeenLabel} />
                        <BodyCell value={item.maintenanceDueLabel} />
                        <BodyCell value={formatCurrency(item.netProfitCents)} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyStateBlock
                title="No trucks yet"
                detail="Detected trucks and registered units will appear here once a session identifies a vehicle."
              />
            )}
          </div>

          <div className="min-w-0">
            {selectedTruckDetail ? (
              <TruckDetailPanel
                detail={selectedTruckDetail}
                showEditForm={showEditForm}
                onEditToggle={() => setShowEditForm((current) => !current)}
                onSave={updateTruck}
              />
            ) : (
              <EmptyStateBlock
                title="Select a truck"
                detail="Pick a truck from the fleet list to review its operating record, maintenance posture, and trip history."
              />
            )}
          </div>
        </div>
      </section>

      {showRegistrationModal && pendingTruck ? (
        <DetectedTruckRegistrationModal
          truck={pendingTruck}
          onClose={() => setDismissedPendingTruckId(pendingTruck.id)}
          onSave={async (input) => {
            await registerDetectedTruck(input)
            setDismissedPendingTruckId(input.truckId)
          }}
        />
      ) : null}
    </>
  )
}

interface TruckDetailPanelProps {
  detail: FleetTruckDetail
  showEditForm: boolean
  onEditToggle: () => void
  onSave: (input: UpdateTruckInput) => Promise<FleetTruckDetail | null>
}

function TruckDetailPanel({
  detail,
  showEditForm,
  onEditToggle,
  onSave,
}: TruckDetailPanelProps) {
  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-stone-800 bg-stone-950/55">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Identity
            </p>
            <h4 className="mt-2 truncate text-xl font-semibold text-stone-100">
              {detail.truck.displayName}
            </h4>
            <p className="mt-2 text-sm text-stone-400">
              {detail.truck.detectedMake ?? 'Unknown make'} {detail.truck.detectedModel ?? ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditToggle}
            className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800"
          >
            {showEditForm ? 'Close editor' : 'Edit truck'}
          </button>
        </div>
        {showEditForm ? <EditTruckForm detail={detail} onSave={onSave} /> : null}
        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Status" value={formatStatus(detail.truck.status)} />
          <StatTile
            label="Odometer"
            value={
              detail.truck.currentOdometerMi != null
                ? `${detail.truck.currentOdometerMi.toFixed(0)} mi`
                : '--'
            }
          />
          <StatTile
            label="Idle hours"
            value={
              detail.truck.idleHours != null
                ? detail.truck.idleHours.toFixed(1)
                : '--'
            }
          />
          <StatTile label="Last seen" value={detail.summary.lastSeenLabel} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryPanel detail={detail} />
        <MaintenanceStatusPanel detail={detail} />
        <ProfitabilityPanel detail={detail} />
      </div>

      <HistorySection
        title="Trip history"
        emptyLabel="No trips recorded for this truck yet."
        rows={
          detail.trips.length
            ? detail.trips.map((trip) => ({
                id: trip.id,
                primary: `${trip.originCity ?? '--'} -> ${trip.destinationCity ?? '--'}`,
                secondary: trip.cargoName ?? trip.status,
                meta: `${trip.distanceMi.toFixed(1)} mi`,
              }))
            : []
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <HistorySection
          title="Fuel history"
          emptyLabel="No fuel events recorded for this truck yet."
          rows={
            detail.fuelEvents.length
              ? detail.fuelEvents.map((event) => ({
                  id: event.id,
                  primary: `${event.gallons.toFixed(2)} gal`,
                  secondary: event.locationLabel ?? event.source,
                  meta: new Date(event.occurredAt).toLocaleDateString(),
                }))
              : []
          }
        />
        <HistorySection
          title="Maintenance history"
          emptyLabel="No maintenance events recorded for this truck yet."
          rows={
            detail.maintenanceEvents.length
              ? detail.maintenanceEvents.map((event) => ({
                  id: event.id,
                  primary: `${event.odometerMi.toFixed(0)} mi`,
                  secondary: event.notes ?? event.source,
                  meta:
                    event.costCents != null
                      ? formatCurrency(-event.costCents)
                      : new Date(event.performedAt).toLocaleDateString(),
                }))
              : []
          }
        />
      </div>

      <HistorySection
        title="Finance entries"
        emptyLabel="No finance entries recorded for this truck yet."
        rows={
          detail.financeEntries.length
            ? detail.financeEntries.map((entry) => ({
                id: entry.id,
                primary: entry.description,
                secondary: entry.category,
                meta: formatCurrency(entry.amountCents),
              }))
            : []
        }
      />

      <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Notes
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {detail.truck.notes?.trim() || 'No truck notes recorded.'}
        </p>
      </section>
    </div>
  )
}

interface DetectedTruckRegistrationModalProps {
  truck: TruckRecord
  onClose: () => void
  onSave: (input: RegisterDetectedTruckInput) => Promise<void>
}

function DetectedTruckRegistrationModal({
  truck,
  onClose,
  onSave,
}: DetectedTruckRegistrationModalProps) {
  const [displayName, setDisplayName] = useState(
    truck.detectedMake && truck.detectedModel
      ? `${truck.detectedMake} ${truck.detectedModel}`
      : truck.displayName,
  )
  const [detectedMake, setDetectedMake] = useState(truck.detectedMake ?? '')
  const [detectedModel, setDetectedModel] = useState(truck.detectedModel ?? '')
  const [startingOdometerMi, setStartingOdometerMi] = useState(
    truck.currentOdometerMi != null ? truck.currentOdometerMi.toFixed(0) : '',
  )
  const [notes, setNotes] = useState(truck.notes ?? '')
  const [saving, setSaving] = useState(false)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-stone-800 bg-[#121416] shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="border-b border-stone-800 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-500">
            Detected truck
          </p>
          <h4 className="mt-2 text-xl font-semibold text-stone-100">
            Register this truck
          </h4>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Keep it short. Confirm the truck identity, set the starting odometer,
            and FleetOps will take over from there.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          <Field
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Primary unit"
          />
          <Field
            label="Starting odometer"
            value={startingOdometerMi}
            onChange={setStartingOdometerMi}
            placeholder="152313"
          />
          <Field
            label="Make"
            value={detectedMake}
            onChange={setDetectedMake}
            placeholder="Kenworth"
          />
          <Field
            label="Model"
            value={detectedModel}
            onChange={setDetectedModel}
            placeholder="W900"
          />
          <TextAreaField
            className="md:col-span-2"
            label="Notes"
            value={notes}
            onChange={setNotes}
            placeholder="Optional operator note"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-stone-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800"
          >
            Later
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave({
                  truckId: truck.id,
                  displayName,
                  detectedMake: detectedMake.trim() || null,
                  detectedModel: detectedModel.trim() || null,
                  startingOdometerMi: parseOptionalNumber(startingOdometerMi),
                  notes: notes.trim() || null,
                })
              } finally {
                setSaving(false)
              }
            }}
            className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25 disabled:opacity-60"
          >
            Save truck
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditTruckFormProps {
  detail: FleetTruckDetail
  onSave: (input: UpdateTruckInput) => Promise<FleetTruckDetail | null>
}

function EditTruckForm({ detail, onSave }: EditTruckFormProps) {
  const [displayName, setDisplayName] = useState(detail.truck.displayName)
  const [detectedMake, setDetectedMake] = useState(detail.truck.detectedMake ?? '')
  const [detectedModel, setDetectedModel] = useState(
    detail.truck.detectedModel ?? '',
  )
  const [startingOdometerMi, setStartingOdometerMi] = useState(
    detail.truck.startingOdometerMi?.toFixed(0) ?? '',
  )
  const [currentOdometerMi, setCurrentOdometerMi] = useState(
    detail.truck.currentOdometerMi?.toFixed(0) ?? '',
  )
  const [status, setStatus] = useState<TruckRecord['status']>(detail.truck.status)
  const [notes, setNotes] = useState(detail.truck.notes ?? '')
  const [saving, setSaving] = useState(false)

  return (
    <div className="grid gap-4 border-b border-stone-800 px-4 py-4 md:grid-cols-2">
      <Field
        label="Display name"
        value={displayName}
        onChange={setDisplayName}
        placeholder="Primary unit"
      />
      <SelectField
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as TruckRecord['status'])}
        options={['active', 'pending', 'inactive', 'ignored']}
      />
      <Field
        label="Make"
        value={detectedMake}
        onChange={setDetectedMake}
        placeholder="Kenworth"
      />
      <Field
        label="Model"
        value={detectedModel}
        onChange={setDetectedModel}
        placeholder="W900"
      />
      <Field
        label="Starting odometer"
        value={startingOdometerMi}
        onChange={setStartingOdometerMi}
        placeholder="152310"
      />
      <Field
        label="Current odometer"
        value={currentOdometerMi}
        onChange={setCurrentOdometerMi}
        placeholder="152313"
      />
      <TextAreaField
        className="md:col-span-2"
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional operating note"
      />
      <div className="md:col-span-2 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave({
                truckId: detail.truck.id,
                displayName,
                detectedMake: detectedMake.trim() || null,
                detectedModel: detectedModel.trim() || null,
                startingOdometerMi: parseOptionalNumber(startingOdometerMi),
                currentOdometerMi: parseOptionalNumber(currentOdometerMi),
                notes: notes.trim() || null,
                status,
              })
            } finally {
              setSaving(false)
            }
          }}
          className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25 disabled:opacity-60"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

function SummaryPanel({ detail }: { detail: FleetTruckDetail }) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Truck operational summary
      </p>
      <div className="mt-4 grid gap-3">
        <StatTile
          label="Trips"
          value={String(detail.summary.totalTrips)}
          compact
        />
        <StatTile
          label="Distance"
          value={`${detail.summary.totalDistanceMi.toFixed(1)} mi`}
          compact
        />
        <StatTile
          label="Average MPG"
          value={
            detail.summary.avgMpg != null
              ? detail.summary.avgMpg.toFixed(1)
              : '--'
          }
          compact
        />
        <StatTile
          label="Fuel history"
          value={`${detail.summary.totalFuelGallons.toFixed(1)} gal`}
          compact
        />
      </div>
    </section>
  )
}

function MaintenanceStatusPanel({ detail }: { detail: FleetTruckDetail }) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Truck maintenance status
      </p>
      <p className="mt-3 text-lg font-semibold text-stone-100">
        {detail.summary.maintenanceDue ? 'Attention due' : 'On schedule'}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-400">
        {detail.summary.maintenanceDueLabel}
      </p>
      <p className="mt-4 text-sm text-stone-500">
        {detail.maintenanceEvents.length
          ? `${detail.maintenanceEvents.length} maintenance entries on record`
          : 'No maintenance entries on record yet'}
      </p>
    </section>
  )
}

function ProfitabilityPanel({ detail }: { detail: FleetTruckDetail }) {
  const costs = useMemo(
    () =>
      detail.financeEntries
        .filter((entry) => entry.amountCents < 0)
        .reduce((sum, entry) => sum + entry.amountCents, 0),
    [detail.financeEntries],
  )

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Truck profitability
      </p>
      <p className="mt-3 text-lg font-semibold text-stone-100">
        {formatCurrency(detail.summary.netProfitCents)}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-400">
        Net operating total for this truck based on recorded finance entries.
      </p>
      <div className="mt-4 grid gap-3">
        <StatTile
          label="Recorded entries"
          value={String(detail.financeEntries.length)}
          compact
        />
        <StatTile
          label="Recorded costs"
          value={formatCurrency(costs)}
          compact
        />
      </div>
    </section>
  )
}

interface HistorySectionProps {
  title: string
  emptyLabel: string
  rows: Array<{
    id: string
    primary: string
    secondary: string
    meta: string
  }>
}

function HistorySection({ title, emptyLabel, rows }: HistorySectionProps) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        {title}
      </p>
      {rows.length ? (
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-200">
                    {row.primary}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{row.secondary}</p>
                </div>
                <p className="shrink-0 text-xs text-stone-400">{row.meta}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateBlock title={title} detail={emptyLabel} compact />
      )}
    </section>
  )
}

function HeaderCell({ label }: { label: string }) {
  return <th className="px-4 py-3 font-medium">{label}</th>
}

function BodyCell({ value, strong = false }: { value: string; strong?: boolean }) {
  return (
    <td
      className={[
        'px-4 py-3 align-top text-stone-300',
        strong ? 'font-medium text-stone-100' : '',
      ].join(' ')}
    >
      {value}
    </td>
  )
}

function StatTile({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <p className={compact ? 'mt-2 text-sm text-stone-200' : 'mt-2 text-base text-stone-200'}>
        {value}
      </p>
    </div>
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
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </span>
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
  options: string[]
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-stone-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatStatus(option as TruckRecord['status'])}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </span>
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

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function formatCurrency(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(amountCents) / 100).toFixed(2)}`
}

function formatStatus(status: TruckRecord['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
