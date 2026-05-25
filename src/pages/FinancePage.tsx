import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { FINANCE_CATEGORIES } from '../lib/finance/contracts'
import type { FinanceEntryInput, FinanceFilters } from '../lib/finance/contracts'
import type { FinanceCategory, FinanceEntryRecord } from '../lib/persistence/contracts'

export function FinancePage() {
  const {
    snapshot,
    filters,
    setFilters,
    filteredEntries,
    totals,
    truckProfitability,
    garageProfitability,
    saveFinanceEntry,
    deleteFinanceEntry,
  } = useFinance()
  const [editingEntry, setEditingEntry] = useState<FinanceEntryRecord | null>(null)

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Finance
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Operating ledger
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Practical business visibility for revenue, operating costs, and margin
          without drifting into bookkeeping bloat.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[330px_minmax(0,1fr)] xl:px-6 xl:py-6">
        <div className="grid gap-4">
          <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Filters
            </p>
            <div className="mt-4 grid gap-3">
              <Field
                label="From"
                value={filters.dateFrom}
                onChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
                placeholder="2026-05-01T00:00:00.000Z"
              />
              <Field
                label="To"
                value={filters.dateTo}
                onChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
                placeholder="2026-05-31T23:59:59.999Z"
              />
              <SelectField
                label="Truck"
                value={filters.truckId}
                onChange={(value) => setFilters((current) => ({ ...current, truckId: value }))}
                options={[
                  { value: '', label: 'All trucks' },
                  ...(snapshot?.trucks ?? []).map((truck) => ({
                    value: truck.id,
                    label: truck.displayName,
                  })),
                ]}
              />
              <SelectField
                label="Garage"
                value={filters.garageId}
                onChange={(value) => setFilters((current) => ({ ...current, garageId: value }))}
                options={[
                  { value: '', label: 'All garages' },
                  ...(snapshot?.garages ?? []).map((garage) => ({
                    value: garage.id,
                    label: garage.name,
                  })),
                ]}
              />
              <SelectField
                label="Category"
                value={filters.category}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    category: value as FinanceFilters['category'],
                  }))
                }
                options={[
                  { value: 'all', label: 'All categories' },
                  ...FINANCE_CATEGORIES.map((category) => ({
                    value: category,
                    label: formatCategory(category),
                  })),
                ]}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-950/55">
            <div className="border-b border-stone-800 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Manual entry
              </p>
            </div>
            <FinanceEntryForm
              key={editingEntry?.id ?? 'new'}
              snapshot={snapshot}
              initialValue={
                editingEntry
                  ? {
                      entryId: editingEntry.id,
                      tripId: editingEntry.tripId,
                      truckId: editingEntry.truckId,
                      garageId: editingEntry.garageId,
                      occurredAt: editingEntry.occurredAt,
                      category: editingEntry.category,
                      amountCents: editingEntry.amountCents,
                      description: editingEntry.description,
                    }
                  : undefined
              }
              onSave={async (input) => {
                await saveFinanceEntry(input)
                setEditingEntry(null)
              }}
            />
          </section>
        </div>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Finance dashboard
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Gross revenue" value={formatCurrency(totals.grossRevenueCents)} />
              <StatTile label="Total expenses" value={formatCurrency(-totals.totalExpensesCents)} />
              <StatTile label="Net profit" value={formatCurrency(totals.netProfitCents)} />
              <StatTile
                label="Operating margin"
                value={totals.operatingMarginPercent != null ? `${totals.operatingMarginPercent.toFixed(1)}%` : '--'}
              />
              <StatTile
                label="Revenue / mile"
                value={totals.revenuePerMile != null ? `$${totals.revenuePerMile.toFixed(2)}` : '--'}
              />
              <StatTile
                label="Cost / mile"
                value={totals.costPerMile != null ? `$${totals.costPerMile.toFixed(2)}` : '--'}
              />
              <StatTile
                label="Fuel cost / mile"
                value={totals.fuelCostPerMile != null ? `$${totals.fuelCostPerMile.toFixed(2)}` : '--'}
              />
              <StatTile
                label="Maintenance reserve / mile"
                value={totals.maintenanceReservePerMile != null ? `$${totals.maintenanceReservePerMile.toFixed(2)}` : '--'}
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <ProfitabilityPanel
              title="Truck-level profitability"
              rows={truckProfitability.map((row) => ({
                ...row,
                label: snapshot?.trucks.find((truck) => truck.id === row.id)?.displayName ?? row.label,
              }))}
            />
            <ProfitabilityPanel
              title="Garage-level profitability"
              rows={garageProfitability.map((row) => ({
                ...row,
                label: snapshot?.garages.find((garage) => garage.id === row.id)?.name ?? row.label,
              }))}
            />
          </div>

          <section className="rounded-2xl border border-stone-800 bg-stone-950/55">
            <div className="border-b border-stone-800 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Ledger
              </p>
            </div>
            {filteredEntries.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-stone-800 text-xs uppercase tracking-[0.22em] text-stone-500">
                    <tr>
                      <HeaderCell label="Date" />
                      <HeaderCell label="Category" />
                      <HeaderCell label="Description" />
                      <HeaderCell label="Source" />
                      <HeaderCell label="Truck" />
                      <HeaderCell label="Garage" />
                      <HeaderCell label="Amount" />
                      <HeaderCell label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-stone-900/70">
                        <BodyCell value={new Date(entry.occurredAt).toLocaleString()} />
                        <BodyCell value={formatCategory(entry.category)} />
                        <BodyCell value={entry.description} />
                        <BodyCell value={entry.source} />
                        <BodyCell
                          value={
                            snapshot?.trucks.find((truck) => truck.id === entry.truckId)?.displayName ??
                            '--'
                          }
                        />
                        <BodyCell
                          value={
                            snapshot?.garages.find((garage) => garage.id === entry.garageId)?.name ??
                            '--'
                          }
                        />
                        <BodyCell value={formatCurrency(entry.amountCents)} />
                        <td className="px-4 py-3">
                          {entry.source === 'manual' ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingEntry(entry)}
                                className="rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteFinanceEntry(entry.id)}
                                className="rounded-lg border border-rose-600/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-500">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyStateBlock
                title="No entries in view"
                detail="Adjust the filters or add a manual entry for fuel, revenue, insurance, tolls, or other operating costs."
              />
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

function FinanceEntryForm({
  snapshot,
  initialValue,
  onSave,
}: {
  snapshot: ReturnType<typeof useFinance>['snapshot']
  initialValue?: FinanceEntryInput
  onSave: (input: FinanceEntryInput) => Promise<void>
}) {
  const [occurredAt, setOccurredAt] = useState(
    initialValue?.occurredAt ?? new Date().toISOString(),
  )
  const [category, setCategory] = useState<FinanceCategory>(
    initialValue?.category ?? 'fuel',
  )
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [amount, setAmount] = useState(
    initialValue ? (initialValue.amountCents / 100).toFixed(2) : '',
  )
  const [truckId, setTruckId] = useState(initialValue?.truckId ?? '')
  const [garageId, setGarageId] = useState(initialValue?.garageId ?? '')
  const [tripId, setTripId] = useState(initialValue?.tripId ?? '')

  return (
    <div className="grid gap-4 px-4 py-4">
      <Field
        label="Occurred at"
        value={occurredAt}
        onChange={setOccurredAt}
        placeholder="2026-05-25T18:30:00.000Z"
      />
      <SelectField
        label="Category"
        value={category}
        onChange={(value) => setCategory(value as FinanceCategory)}
        options={FINANCE_CATEGORIES.map((item) => ({
          value: item,
          label: formatCategory(item),
        }))}
      />
      <Field
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Fuel stop in Cheyenne"
      />
      <Field
        label="Amount ($)"
        value={amount}
        onChange={setAmount}
        placeholder="-145.20"
      />
      <SelectField
        label="Truck"
        value={truckId}
        onChange={setTruckId}
        options={[
          { value: '', label: 'Unassigned' },
          ...((snapshot?.trucks ?? []).map((truck) => ({
            value: truck.id,
            label: truck.displayName,
          }))),
        ]}
      />
      <SelectField
        label="Garage"
        value={garageId}
        onChange={setGarageId}
        options={[
          { value: '', label: 'Unassigned' },
          ...((snapshot?.garages ?? []).map((garage) => ({
            value: garage.id,
            label: garage.name,
          }))),
        ]}
      />
      <SelectField
        label="Trip"
        value={tripId}
        onChange={setTripId}
        options={[
          { value: '', label: 'Unassigned' },
          ...((snapshot?.trips ?? []).map((trip) => ({
            value: trip.id,
            label: `${trip.originCity ?? '--'} -> ${trip.destinationCity ?? '--'}`,
          }))),
        ]}
      />
      <button
        type="button"
        onClick={() =>
          void onSave({
            entryId: initialValue?.entryId,
            tripId: tripId || null,
            truckId: truckId || null,
            garageId: garageId || null,
            occurredAt,
            category,
            amountCents: parseAmountToCents(amount),
            description,
          })
        }
        className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25"
      >
        {initialValue ? 'Save changes' : 'Add entry'}
      </button>
    </div>
  )
}

function ProfitabilityPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    id: string
    label: string
    miles: number
    revenueCents: number
    expensesCents: number
    netProfitCents: number
    marginPercent: number | null
  }>
}) {
  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{title}</p>
      {rows.length ? (
        <div className="mt-4 grid gap-3">
          {rows.slice(0, 6).map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-200">{row.label}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {row.marginPercent != null ? `${row.marginPercent.toFixed(1)}% margin` : 'No revenue yet'}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-stone-100">{formatCurrency(row.netProfitCents)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateBlock
          title={title}
          detail="No profitability rows match the active filters yet."
          compact
        />
      )}
    </section>
  )
}

function HeaderCell({ label }: { label: string }) {
  return <th className="px-4 py-3 font-medium">{label}</th>
}

function BodyCell({ value }: { value: string }) {
  return <td className="px-4 py-3 align-top text-stone-300">{value}</td>
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

function formatCategory(category: FinanceFilters['category']): string {
  return category === 'all'
    ? 'All'
    : category
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function parseAmountToCents(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}
