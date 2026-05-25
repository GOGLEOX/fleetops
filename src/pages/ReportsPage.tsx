import { useState } from 'react'
import { useReports } from '../hooks/useReports'
import type {
  ReportType,
} from '../lib/reports/contracts'

const REPORT_TYPES: Array<{ type: ReportType; label: string; description: string }> = [
  {
    type: 'trip_sheet',
    label: 'Trip Sheet',
    description: 'Single-trip operating breakdown with revenue, expenses, damage, and idle time.',
  },
  {
    type: 'driver_session_summary',
    label: 'Driver Session Summary',
    description: 'Session-level view of tracked time, distance, fuel use, and inference state.',
  },
  {
    type: 'truck_maintenance_summary',
    label: 'Truck Maintenance Summary',
    description: 'Rule status, completed service history, and maintenance cost for one truck.',
  },
  {
    type: 'fleet_profitability_report',
    label: 'Fleet Profitability Report',
    description: 'Fleet-wide revenue, expenses, net profit, and truck-level contribution.',
  },
  {
    type: 'garage_operations_report',
    label: 'Garage Operations Report',
    description: 'Assigned trucks, linked trips, and operating output for one hub.',
  },
  {
    type: 'monthly_carrier_snapshot',
    label: 'Monthly Carrier Snapshot',
    description: 'Monthly operations summary with margin, mileage, active hubs, and notes.',
  },
]

export function ReportsPage() {
  const { snapshot, currentReport, generateReport, openSavedReport, exportReport } =
    useReports()
  const [selectedType, setSelectedType] = useState<ReportType>('trip_sheet')
  const [tripId, setTripId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [truckId, setTruckId] = useState('')
  const [garageId, setGarageId] = useState('')
  const [month, setMonth] = useState('')

  return (
    <section className="rounded-3xl border border-stone-800 bg-[linear-gradient(180deg,_rgba(30,33,36,0.98)_0%,_rgba(16,18,20,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stone-800 px-5 py-4 lg:px-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500">
          Reports
        </p>
        <h3 className="mt-2 text-xl font-semibold text-stone-100">
          Operational reporting
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Generate printable carrier reports from local records with grounded, industrial presentation.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[350px_260px_minmax(0,1fr)] xl:px-6 xl:py-6">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/55">
          <div className="border-b border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Report types
            </p>
          </div>
          <div className="grid gap-3 p-4">
            {REPORT_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type)}
                className={[
                  'rounded-2xl border px-4 py-4 text-left transition-colors',
                  selectedType === item.type
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-stone-800 bg-stone-900/70 hover:bg-stone-900',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-stone-100">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-950/55">
          <div className="border-b border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Generate
            </p>
          </div>
          <div className="grid gap-4 px-4 py-4">
            {selectedType === 'trip_sheet' ? (
              <SelectField
                label="Trip"
                value={tripId}
                onChange={setTripId}
                options={(snapshot?.trips ?? []).map((trip) => ({
                  value: trip.id,
                  label: `${trip.originCity ?? '--'} -> ${trip.destinationCity ?? '--'}`,
                }))}
              />
            ) : null}
            {selectedType === 'driver_session_summary' ? (
              <SelectField
                label="Session"
                value={sessionId}
                onChange={setSessionId}
                options={(snapshot?.sessions ?? []).map((session) => ({
                  value: session.id,
                  label: `${new Date(session.startedAt).toLocaleString()} • ${session.distanceMi.toFixed(1)} mi`,
                }))}
              />
            ) : null}
            {selectedType === 'truck_maintenance_summary' ? (
              <SelectField
                label="Truck"
                value={truckId}
                onChange={setTruckId}
                options={(snapshot?.trucks ?? []).map((truck) => ({
                  value: truck.id,
                  label: truck.displayName,
                }))}
              />
            ) : null}
            {selectedType === 'garage_operations_report' ? (
              <SelectField
                label="Garage"
                value={garageId}
                onChange={setGarageId}
                options={(snapshot?.garages ?? []).map((garage) => ({
                  value: garage.id,
                  label: garage.name,
                }))}
              />
            ) : null}
            {selectedType === 'monthly_carrier_snapshot' ? (
              <SelectField
                label="Month"
                value={month}
                onChange={setMonth}
                options={(snapshot?.availableMonths ?? []).map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            ) : null}
            <button
              type="button"
              onClick={() =>
                void generateReport({
                  type: selectedType,
                  tripId: tripId || undefined,
                  sessionId: sessionId || undefined,
                  truckId: truckId || undefined,
                  garageId: garageId || undefined,
                  month: month || undefined,
                })
              }
              className="rounded-xl border border-amber-600 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/25"
            >
              Generate report
            </button>
          </div>

          <div className="border-y border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Saved reports
            </p>
          </div>
          <div className="grid gap-3 p-4">
            {snapshot?.savedReports.length ? (
              snapshot.savedReports.slice(0, 10).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => void openSavedReport(report.id)}
                  className="rounded-xl border border-stone-800 bg-stone-900/70 px-3 py-3 text-left hover:bg-stone-900"
                >
                  <p className="text-sm font-medium text-stone-100">{report.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </button>
              ))
            ) : (
              <EmptyStateBlock
                title="No saved reports yet"
                detail="Generated reports are stored locally in the reports table for later review."
                compact
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-950/55">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Preview
            </p>
            {currentReport ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => printReportHtml(currentReport.html)}
                  className="rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-800"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => void exportReport(currentReport.record.id, 'html')}
                  className="rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-800"
                >
                  Export HTML
                </button>
                <button
                  type="button"
                  onClick={() => void exportReport(currentReport.record.id, 'pdf')}
                  className="rounded-lg border border-amber-600 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/25"
                >
                  Export PDF
                </button>
              </div>
            ) : null}
          </div>
          {currentReport ? (
            <iframe
              title="Report preview"
              srcDoc={currentReport.html}
              className="h-[920px] w-full rounded-b-2xl border-0 bg-white"
            />
          ) : (
            <EmptyStateBlock
              title="Generate a report"
              detail="Pick a report type, choose a real record context where needed, and generate a printable document from stored FleetOps data."
            />
          )}
        </div>
      </div>
    </section>
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
        <option value="">Auto-select latest available</option>
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
        compact ? 'px-4 py-4' : 'm-4 px-4 py-5',
      ].join(' ')}
    >
      <p className="text-sm font-medium text-stone-300">{title}</p>
      <p className="mt-2 text-sm leading-6">{detail}</p>
    </div>
  )
}

function printReportHtml(html: string) {
  const previewWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!previewWindow) {
    return
  }

  previewWindow.document.open()
  previewWindow.document.write(html)
  previewWindow.document.close()
  previewWindow.focus()
  previewWindow.print()
}
