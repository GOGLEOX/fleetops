import { useMemo, useState } from 'react'
import { useGarages } from '../hooks/useGarages'
import type {
  GarageDetail,
  GarageUpsertInput,
} from '../lib/garages/contracts'

export function GaragesPage() {
  const {
    snapshot,
    selectedGarageId,
    selectedGarageDetail,
    selectGarage,
    saveGarage,
    assignTruckToGarage,
    assignTripToGarage,
  } = useGarages()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Garages
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Operational hubs
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Garages act as divisions, yards, and route bases where trucks and trips
          can be anchored manually without pretending the game provides full company truth.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] xl:px-6 xl:py-6">
        <div className="min-w-0 rounded-2xl border border-stone-800 bg-stone-950/55">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Garage list
            </p>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm((current) => !current)
                setShowEditForm(false)
              }}
              className="rounded-xl border border-stone-700 bg-stone-900/80 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800"
            >
              {showCreateForm ? 'Close form' : 'New garage'}
            </button>
          </div>

          {showCreateForm ? (
            <GarageForm
              title="Create garage"
              submitLabel="Save garage"
              onSave={async (input) => {
                await saveGarage(input)
                setShowCreateForm(false)
              }}
            />
          ) : null}

          {snapshot?.garages.length ? (
            <div className="grid gap-3 p-4">
              {snapshot.garages.map((item) => (
                <button
                  key={item.garage.id}
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setShowEditForm(false)
                    selectGarage(item.garage.id)
                  }}
                  className={[
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    selectedGarageId === item.garage.id
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-stone-800 bg-stone-900/70 hover:bg-stone-900',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-stone-100">
                        {item.garage.name}
                      </p>
                      <p className="mt-1 text-sm text-stone-400">
                        {[item.garage.divisionName, `${item.garage.city}, ${item.garage.state}`]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs uppercase tracking-[0.22em] text-stone-500">
                      {item.assignedTruckCount} trucks
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MiniMetric label="Trips" value={String(item.linkedTripCount)} />
                    <MiniMetric label="Revenue" value={formatCurrency(item.revenueCents)} />
                    <MiniMetric label="Last activity" value={item.lastActivityLabel} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyStateBlock
              title="No garages yet"
              detail="Create a yard, division, or terminal to start anchoring trucks and trips."
            />
          )}
        </div>

        <div className="min-w-0">
            {selectedGarageDetail ? (
              <GarageDetailPanel
                key={selectedGarageDetail.garage.id}
                detail={selectedGarageDetail}
                showEditForm={showEditForm}
              onEditToggle={() => {
                setShowEditForm((current) => !current)
                setShowCreateForm(false)
              }}
              onSaveGarage={async (input) => {
                await saveGarage(input)
                setShowEditForm(false)
              }}
              onAssignTruck={assignTruckToGarage}
              onAssignTrip={assignTripToGarage}
            />
          ) : (
            <EmptyStateBlock
              title="Select a garage"
              detail="Open a garage to review route activity, assigned trucks, linked trips, and regional suggestions."
            />
          )}
        </div>
      </div>
    </section>
  )
}

interface GarageDetailPanelProps {
  detail: GarageDetail
  showEditForm: boolean
  onEditToggle: () => void
  onSaveGarage: (input: GarageUpsertInput) => Promise<void>
  onAssignTruck: (input: {
    truckId: string
    garageId: string
    notes: string | null
  }) => Promise<GarageDetail | null>
  onAssignTrip: (input: {
    tripId: string
    garageId: string | null
  }) => Promise<GarageDetail | null>
}

function GarageDetailPanel({
  detail,
  showEditForm,
  onEditToggle,
  onSaveGarage,
  onAssignTruck,
  onAssignTrip,
}: GarageDetailPanelProps) {
  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-stone-800 bg-stone-950/55">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Garage detail
            </p>
            <h4 className="mt-2 text-xl font-semibold text-stone-100">
              {detail.garage.name}
            </h4>
            <p className="mt-2 text-sm text-stone-400">
              {[detail.garage.divisionName, `${detail.garage.city}, ${detail.garage.state}`]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditToggle}
            className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800"
          >
            {showEditForm ? 'Close editor' : 'Edit garage'}
          </button>
        </div>

        {showEditForm ? (
          <GarageForm
            title="Edit garage"
            submitLabel="Save changes"
            initialValue={{
              garageId: detail.garage.id,
              name: detail.garage.name,
              city: detail.garage.city,
              state: detail.garage.state,
              divisionName: detail.garage.divisionName,
              notes: detail.garage.notes,
            }}
            onSave={onSaveGarage}
          />
        ) : null}

        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Assigned trucks" value={String(detail.analytics.assignedTruckCount)} />
          <StatTile label="Revenue linked" value={formatCurrency(detail.analytics.revenueCents)} />
          <StatTile label="Most common cargo" value={detail.analytics.mostCommonCargo ?? '--'} />
          <StatTile label="Last activity" value={detail.analytics.lastActivityLabel} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <RegionalActivitySummary detail={detail} />
        <CostSummaryPanel detail={detail} />
        <AssignmentControls
          detail={detail}
          onAssignTruck={onAssignTruck}
          onAssignTrip={onAssignTrip}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HistorySection
          title="Assigned trucks"
          emptyLabel="No trucks are assigned to this garage yet."
          rows={
            detail.assignedTrucks.map((truck) => ({
              id: truck.id,
              primary: truck.displayName,
              secondary: `${truck.detectedMake ?? 'Unknown make'} ${truck.detectedModel ?? ''}`.trim(),
              meta: truck.currentOdometerMi != null ? `${truck.currentOdometerMi.toFixed(0)} mi` : '--',
            }))
          }
        />
        <HistorySection
          title="Linked trips"
          emptyLabel="No trips are manually linked to this garage yet."
          rows={
            detail.linkedTrips.map((trip) => ({
              id: trip.id,
              primary: `${trip.originCity ?? '--'} -> ${trip.destinationCity ?? '--'}`,
              secondary: trip.cargoName ?? trip.status,
              meta: formatCurrency(trip.revenueCents ?? 0),
            }))
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HistorySection
          title="Suggested trip links"
          eyebrow="Suggestions only"
          emptyLabel="No nearby trip matches are waiting for review."
          rows={
            detail.tripSuggestions.map((suggestion) => ({
              id: suggestion.tripId,
              primary: suggestion.city,
              secondary: `${capitalize(suggestion.matchType)} suggestion`,
              meta: suggestion.reason,
              action: (
                <button
                  type="button"
                  onClick={() =>
                    void onAssignTrip({
                      tripId: suggestion.tripId,
                      garageId: detail.garage.id,
                    })
                  }
                  className="rounded-lg border border-amber-600 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/25"
                >
                  Assign
                </button>
              ),
            }))
          }
        />
        <HistorySection
          title="Finance and maintenance"
          emptyLabel="No operating cost or finance entries are linked here yet."
          rows={[
            ...detail.financeEntries.map((entry) => ({
              id: entry.id,
              primary: entry.description,
              secondary: entry.category,
              meta: formatCurrency(entry.amountCents),
            })),
            ...detail.maintenanceEvents.map((event) => ({
              id: event.id,
              primary: `Maintenance at ${event.odometerMi.toFixed(0)} mi`,
              secondary: event.notes ?? event.source,
              meta: formatCurrency(event.costCents ?? 0),
            })),
          ]}
        />
      </div>

      <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          Notes
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {detail.garage.notes?.trim() || 'No garage notes recorded.'}
        </p>
      </section>
    </div>
  )
}

function GarageForm({
  title,
  submitLabel,
  initialValue,
  onSave,
}: {
  title: string
  submitLabel: string
  initialValue?: GarageUpsertInput
  onSave: (input: GarageUpsertInput) => Promise<void>
}) {
  const [name, setName] = useState(initialValue?.name ?? '')
  const [city, setCity] = useState(initialValue?.city ?? '')
  const [state, setState] = useState(initialValue?.state ?? '')
  const [divisionName, setDivisionName] = useState(initialValue?.divisionName ?? '')
  const [notes, setNotes] = useState(initialValue?.notes ?? '')
  const [saving, setSaving] = useState(false)

  return (
    <div className="grid gap-4 border-b border-stone-800 px-4 py-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="text-sm font-medium text-stone-200">{title}</p>
      </div>
      <Field label="Name" value={name} onChange={setName} placeholder="Pacific Yard" />
      <Field
        label="Division"
        value={divisionName}
        onChange={setDivisionName}
        placeholder="Southwest Division"
      />
      <Field label="City" value={city} onChange={setCity} placeholder="Bakersfield" />
      <Field label="State" value={state} onChange={setState} placeholder="CA" />
      <TextAreaField
        className="md:col-span-2"
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Terminal or dispatch note"
      />
      <div className="md:col-span-2 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onSave({
                garageId: initialValue?.garageId,
                name,
                city,
                state,
                divisionName: divisionName.trim() || null,
                notes: notes.trim() || null,
              })
            } finally {
              setSaving(false)
            }
          }}
          className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

function RegionalActivitySummary({ detail }: { detail: GarageDetail }) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Regional activity summary
      </p>
      <div className="mt-4 grid gap-3">
        <MiniMetric label="Departing nearby city" value={String(detail.analytics.departingTripCount)} />
        <MiniMetric label="Arriving nearby city" value={String(detail.analytics.arrivingTripCount)} />
        <MiniMetric label="Linked trips" value={String(detail.linkedTrips.length)} />
        <MiniMetric label="Last activity" value={detail.analytics.lastActivityLabel} />
      </div>
    </section>
  )
}

function CostSummaryPanel({ detail }: { detail: GarageDetail }) {
  const marginLabel =
    detail.analytics.averageOperatingMarginPercent != null
      ? `${detail.analytics.averageOperatingMarginPercent.toFixed(1)}%`
      : '--'

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Operating analytics
      </p>
      <div className="mt-4 grid gap-3">
        <MiniMetric label="Fuel spend" value={formatCurrency(-detail.analytics.fuelSpendCents)} />
        <MiniMetric
          label="Maintenance cost"
          value={formatCurrency(-detail.analytics.maintenanceCostCents)}
        />
        <MiniMetric label="Average margin" value={marginLabel} />
        <MiniMetric
          label="Most common cargo"
          value={detail.analytics.mostCommonCargo ?? '--'}
        />
      </div>
    </section>
  )
}

function AssignmentControls({
  detail,
  onAssignTruck,
  onAssignTrip,
}: {
  detail: GarageDetail
  onAssignTruck: (input: {
    truckId: string
    garageId: string
    notes: string | null
  }) => Promise<GarageDetail | null>
  onAssignTrip: (input: {
    tripId: string
    garageId: string | null
  }) => Promise<GarageDetail | null>
}) {
  const [truckId, setTruckId] = useState(detail.availableTrucks[0]?.id ?? '')
  const [tripId, setTripId] = useState(detail.availableTrips[0]?.id ?? '')

  const truckOptions = useMemo(
    () =>
      detail.availableTrucks.map((truck) => ({
        value: truck.id,
        label: truck.displayName,
      })),
    [detail.availableTrucks],
  )
  const tripOptions = useMemo(
    () =>
      detail.availableTrips.map((trip) => ({
        value: trip.id,
        label: `${trip.originCity ?? '--'} -> ${trip.destinationCity ?? '--'}`,
      })),
    [detail.availableTrips],
  )

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
        Garage assignment controls
      </p>
      <div className="mt-4 grid gap-4">
        <SelectField
          label="Assign truck"
          value={truckId}
          onChange={setTruckId}
          options={truckOptions}
        />
        <button
          type="button"
          disabled={!truckId}
          onClick={() =>
            void onAssignTruck({
              truckId,
              garageId: detail.garage.id,
              notes: null,
            })
          }
          className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800 disabled:opacity-50"
        >
          Assign selected truck
        </button>

        <SelectField
          label="Assign trip"
          value={tripId}
          onChange={setTripId}
          options={tripOptions}
        />
        <button
          type="button"
          disabled={!tripId}
          onClick={() =>
            void onAssignTrip({
              tripId,
              garageId: detail.garage.id,
            })
          }
          className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 py-2 text-sm text-stone-200 hover:bg-stone-800 disabled:opacity-50"
        >
          Link selected trip
        </button>
      </div>
    </section>
  )
}

function HistorySection({
  title,
  rows,
  emptyLabel,
  eyebrow,
}: {
  title: string
  rows: Array<{
    id: string
    primary: string
    secondary: string
    meta: string
    action?: React.ReactNode
  }>
  emptyLabel: string
  eyebrow?: string
}) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{title}</p>
        {eyebrow ? (
          <p className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200">
            {eyebrow}
          </p>
        ) : null}
      </div>
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
                  <p className="mt-2 text-xs text-stone-400">{row.meta}</p>
                </div>
                {row.action}
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-stone-200">{value}</p>
    </div>
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

function formatCurrency(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(amountCents) / 100).toFixed(2)}`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
