import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FinanceEntryRecord,
  NewReportRecord,
  SessionRecord,
  TripRecord,
  TruckRecord,
} from '../../src/lib/persistence/contracts'
import type {
  GeneratedReport,
  ReportDocumentPayload,
  ReportGenerateInput,
  ReportsSnapshot,
} from '../../src/lib/reports/contracts'
import {
  parseStoredReport,
  renderReportHtml,
} from '../../src/lib/reports/render'
import {
  calculateFinanceTotals,
  calculateProfitabilityRows,
} from '../../src/lib/finance/calculations'
import {
  evaluateTruckMaintenanceStatuses,
  hasMaintenanceAttention,
} from '../../src/lib/maintenance/evaluation'

export class ReportsService {
  private readonly repositories: FleetOpsRepositories

  public constructor(repositories: FleetOpsRepositories) {
    this.repositories = repositories
  }

  public getSnapshot(): ReportsSnapshot {
    const trips = this.repositories.trips
      .list()
      .filter((trip) => trip.status === 'completed')
    const sessions = this.repositories.sessionRecords.list()
    const trucks = this.repositories.trucks
      .list()
      .filter((truck) => truck.status !== 'ignored')
    const garages = this.repositories.garages.list()
    const availableMonths = [...collectAvailableMonths({
      trips,
      sessions,
      entries: this.repositories.financeEntries.list(),
    })]

    return {
      savedReports: this.repositories.reports.list(),
      trips,
      sessions,
      trucks,
      garages,
      availableMonths,
    }
  }

  public generateReport(input: ReportGenerateInput): GeneratedReport | null {
    const payload = this.buildPayload(input)
    if (!payload) {
      return null
    }

    const recordInput: NewReportRecord = {
      type: payload.type,
      title: payload.title,
      generatedAt: payload.generatedAt,
      payloadJson: JSON.stringify(payload),
    }
    const record = this.repositories.reports.create(recordInput)

    return {
      record,
      payload,
      html: renderReportHtml(payload),
    }
  }

  public getGeneratedReport(reportId: string): GeneratedReport | null {
    const record = this.repositories.reports.get(reportId)
    if (!record) {
      return null
    }

    const payload = parseStoredReport(record)
    return {
      record,
      payload,
      html: renderReportHtml(payload),
    }
  }

  public async exportReport(
    reportId: string,
    format: 'html' | 'pdf',
  ): Promise<boolean> {
    const { BrowserWindow, dialog } = await import('electron')
    const generated = this.getGeneratedReport(reportId)
    if (!generated) {
      return false
    }

    const extension = format === 'html' ? 'html' : 'pdf'
    const defaultPath = path.join(
      process.cwd(),
      `${slugify(generated.payload.title)}.${extension}`,
    )
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters:
        format === 'html'
          ? [{ name: 'HTML', extensions: ['html'] }]
          : [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (result.canceled || !result.filePath) {
      return false
    }

    if (format === 'html') {
      await writeFile(result.filePath, generated.html, 'utf8')
      return true
    }

    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
      },
    })

    try {
      await window.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(generated.html)}`,
      )
      const pdfBuffer = await window.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
      })
      await writeFile(result.filePath, pdfBuffer)
      return true
    } finally {
      window.destroy()
    }
  }

  private buildPayload(input: ReportGenerateInput): ReportDocumentPayload | null {
    switch (input.type) {
      case 'trip_sheet':
        return this.buildTripSheet(input.tripId)
      case 'driver_session_summary':
        return this.buildDriverSessionSummary(input.sessionId)
      case 'truck_maintenance_summary':
        return this.buildTruckMaintenanceSummary(input.truckId)
      case 'fleet_profitability_report':
        return this.buildFleetProfitabilityReport()
      case 'garage_operations_report':
        return this.buildGarageOperationsReport(input.garageId)
      case 'monthly_carrier_snapshot':
        return this.buildMonthlyCarrierSnapshot(input.month)
    }
  }

  private buildTripSheet(tripId?: string): ReportDocumentPayload | null {
    const trip = tripId ? this.repositories.trips.get(tripId) : this.repositories.trips.list()[0]
    if (!trip) {
      return null
    }

    const truck = this.repositories.trucks.get(trip.truckId)
    const entries = this.repositories.financeEntries.listByTripId(trip.id)
    const revenue = entries
      .filter((entry) => entry.category === 'revenue')
      .reduce((sum, entry) => sum + Math.max(entry.amountCents, 0), 0)
    const expenses = Math.abs(
      entries
        .filter((entry) => entry.category !== 'revenue')
        .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
    )
    const damageDelta =
      trip.damageStart != null && trip.damageEnd != null
        ? `${((trip.damageEnd - trip.damageStart) * 100).toFixed(1)}%`
        : '--'

    return {
      type: 'trip_sheet',
      title: `Trip Sheet • ${trip.originCity ?? '--'} to ${trip.destinationCity ?? '--'}`,
      generatedAt: nowIso(),
      subjectLabel: `Trip ${trip.id}`,
      summaryItems: [
        { label: 'Truck', value: truck?.displayName ?? '--' },
        { label: 'Cargo', value: trip.cargoName ?? '--' },
        { label: 'Distance', value: formatMiles(trip.distanceMi) },
        { label: 'Net', value: formatCurrency(revenue - expenses) },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Trip sheet',
          columns: ['Field', 'Value'],
          rows: [
            ['Truck', truck?.displayName ?? '--'],
            ['Cargo', trip.cargoName ?? '--'],
            ['Origin', trip.originCity ?? '--'],
            ['Destination', trip.destinationCity ?? '--'],
            ['Start time', formatTimestamp(trip.startedAt)],
            ['End time', formatTimestamp(trip.endedAt ?? '--')],
            ['Distance', formatMiles(trip.distanceMi)],
            ['Fuel used', `${trip.fuelUsedGal.toFixed(2)} gal`],
            ['MPG', trip.avgMpg != null ? trip.avgMpg.toFixed(2) : '--'],
            ['Revenue', trip.revenueCents != null ? formatCurrency(trip.revenueCents) : '--'],
            ['Expenses', formatCurrency(-expenses)],
            ['Net', formatCurrency(revenue - expenses)],
            ['Idle time', `${trip.idleMinutes.toFixed(1)} min`],
            ['Damage delta', damageDelta],
            ['Notes', trip.notes ?? '--'],
          ],
        },
      ],
    }
  }

  private buildDriverSessionSummary(sessionId?: string): ReportDocumentPayload | null {
    const session = sessionId
      ? this.repositories.sessionRecords.get(sessionId)
      : this.repositories.sessionRecords.list()[0]
    if (!session) {
      return null
    }

    const truck = session.truckId ? this.repositories.trucks.get(session.truckId) : null
    const trip = session.tripId ? this.repositories.trips.get(session.tripId) : null

    return {
      type: 'driver_session_summary',
      title: 'Driver Session Summary',
      generatedAt: nowIso(),
      subjectLabel: `Session ${session.id}`,
      summaryItems: [
        { label: 'Truck', value: truck?.displayName ?? '--' },
        { label: 'Distance', value: formatMiles(session.distanceMi) },
        { label: 'Fuel used', value: `${session.fuelUsedGal.toFixed(2)} gal` },
        { label: 'Idle', value: `${session.idleMinutes.toFixed(1)} min` },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Session detail',
          columns: ['Field', 'Value'],
          rows: [
            ['Truck', truck?.displayName ?? '--'],
            ['Trip', trip ? `${trip.originCity ?? '--'} to ${trip.destinationCity ?? '--'}` : '--'],
            ['Started', formatTimestamp(session.startedAt)],
            ['Ended', formatTimestamp(session.endedAt ?? session.lastFrameAt)],
            ['Distance', formatMiles(session.distanceMi)],
            ['Fuel used', `${session.fuelUsedGal.toFixed(2)} gal`],
            ['Idle time', `${session.idleMinutes.toFixed(1)} min`],
            ['Source', session.source],
            ['Inferred', session.inferred ? 'Yes' : 'No'],
            ['Notes', session.notes ?? '--'],
          ],
        },
      ],
    }
  }

  private buildTruckMaintenanceSummary(truckId?: string): ReportDocumentPayload | null {
    const truck = truckId ? this.repositories.trucks.get(truckId) : this.repositories.trucks.list()[0]
    if (!truck) {
      return null
    }

    const rules = this.repositories.maintenanceRules.list()
    const events = this.repositories.maintenanceEvents.listByTruckId(truck.id)
    const statuses = evaluateTruckMaintenanceStatuses(truck, rules, events)
    const maintenanceEntries = this.repositories.financeEntries
      .listByTruckId(truck.id)
      .filter((entry) => entry.category === 'maintenance' || entry.category === 'repair')
    const totalCost = maintenanceEntries.reduce((sum, entry) => sum + Math.abs(Math.min(entry.amountCents, 0)), 0)

    return {
      type: 'truck_maintenance_summary',
      title: `Truck Maintenance Summary • ${truck.displayName}`,
      generatedAt: nowIso(),
      subjectLabel: `${truck.detectedMake ?? '--'} ${truck.detectedModel ?? ''}`.trim(),
      summaryItems: [
        { label: 'Current odometer', value: formatMiles(truck.currentOdometerMi ?? truck.startingOdometerMi ?? 0) },
        { label: 'Due items', value: String(statuses.filter((status) => status.status === 'due_now').length) },
        { label: 'Due soon', value: String(statuses.filter((status) => status.status === 'due_soon').length) },
        { label: 'Maintenance cost', value: formatCurrency(-totalCost) },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Service interval status',
          columns: ['Rule', 'Status', 'Miles since service', 'Next due'],
          rows: statuses.map((status) => [
            status.rule.name,
            formatMaintenanceStatus(status.status),
            formatMiles(status.milesSinceService),
            formatMiles(status.nextDueOdometerMi),
          ]),
        },
        {
          kind: 'table',
          title: 'Completed history',
          columns: ['Date', 'Rule', 'Odometer', 'Cost', 'Notes'],
          rows: events.map((event) => [
            formatTimestamp(event.performedAt),
            event.ruleId ? this.repositories.maintenanceRules.get(event.ruleId)?.name ?? 'Manual maintenance' : 'Manual maintenance',
            formatMiles(event.odometerMi),
            event.costCents != null ? formatCurrency(-Math.abs(event.costCents)) : '--',
            event.notes ?? '--',
          ]),
        },
      ],
    }
  }

  private buildFleetProfitabilityReport(): ReportDocumentPayload {
    const trips = this.repositories.trips.list().filter((trip) => trip.status === 'completed')
    const entries = this.repositories.financeEntries.list()
    const totals = calculateFinanceTotals(entries, trips)
    const profitability = calculateProfitabilityRows(entries, trips, 'truck')

    return {
      type: 'fleet_profitability_report',
      title: 'Fleet Profitability Report',
      generatedAt: nowIso(),
      subjectLabel: 'Whole fleet',
      summaryItems: [
        { label: 'Gross revenue', value: formatCurrency(totals.grossRevenueCents) },
        { label: 'Expenses', value: formatCurrency(-totals.totalExpensesCents) },
        { label: 'Net profit', value: formatCurrency(totals.netProfitCents) },
        { label: 'Operating margin', value: totals.operatingMarginPercent != null ? `${totals.operatingMarginPercent.toFixed(1)}%` : '--' },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Truck profitability',
          columns: ['Truck', 'Miles', 'Revenue', 'Expenses', 'Net', 'Margin'],
          rows: profitability.map((row) => [
            this.repositories.trucks.get(row.id)?.displayName ?? row.label,
            formatMiles(row.miles),
            formatCurrency(row.revenueCents),
            formatCurrency(-row.expensesCents),
            formatCurrency(row.netProfitCents),
            row.marginPercent != null ? `${row.marginPercent.toFixed(1)}%` : '--',
          ]),
        },
      ],
    }
  }

  private buildGarageOperationsReport(garageId?: string): ReportDocumentPayload | null {
    const garage = garageId ? this.repositories.garages.get(garageId) : this.repositories.garages.list()[0]
    if (!garage) {
      return null
    }

    const linkedTrips = this.repositories.trips.listByGarageId(garage.id)
    const assignments = this.repositories.truckGarageAssignments.listByGarageId(garage.id)
    const assignedTrucks = assignments
      .map((assignment) => this.repositories.trucks.get(assignment.truckId))
      .filter((truck): truck is TruckRecord => truck != null)
    const entries = this.repositories.financeEntries.listByGarageId(garage.id)
    const totals = calculateFinanceTotals(entries, linkedTrips)
    const cargo = mostCommon(
      linkedTrips.map((trip) => trip.cargoName).filter((value): value is string => Boolean(value)),
    )

    return {
      type: 'garage_operations_report',
      title: `Garage Operations Report • ${garage.name}`,
      generatedAt: nowIso(),
      subjectLabel: `${garage.city}, ${garage.state}`,
      summaryItems: [
        { label: 'Assigned trucks', value: String(assignedTrucks.length) },
        { label: 'Linked trips', value: String(linkedTrips.length) },
        { label: 'Net profit', value: formatCurrency(totals.netProfitCents) },
        { label: 'Most common cargo', value: cargo ?? '--' },
      ],
      sections: [
        {
          kind: 'table',
          title: 'Garage operating view',
          columns: ['Truck', 'Last seen', 'Status'],
          rows: assignedTrucks.map((truck) => [
            truck.displayName,
            formatTimestamp(truck.lastSeenAt),
            truck.status,
          ]),
        },
        {
          kind: 'table',
          title: 'Linked trip activity',
          columns: ['Route', 'Cargo', 'Distance', 'Revenue'],
          rows: linkedTrips.map((trip) => [
            `${trip.originCity ?? '--'} to ${trip.destinationCity ?? '--'}`,
            trip.cargoName ?? '--',
            formatMiles(trip.distanceMi),
            trip.revenueCents != null ? formatCurrency(trip.revenueCents) : '--',
          ]),
        },
      ],
    }
  }

  private buildMonthlyCarrierSnapshot(month?: string): ReportDocumentPayload | null {
    const selectedMonth = month ?? this.getSnapshot().availableMonths[0]
    if (!selectedMonth) {
      return null
    }

    const trips = this.repositories.trips
      .list()
      .filter((trip) => trip.startedAt.startsWith(selectedMonth))
    const entries = this.repositories.financeEntries
      .list()
      .filter((entry) => entry.occurredAt.startsWith(selectedMonth))
    const sessions = this.repositories.sessionRecords
      .list()
      .filter((session) => session.startedAt.startsWith(selectedMonth))
    const totals = calculateFinanceTotals(entries, trips)
    const trucks = this.repositories.trucks
      .list()
      .filter((truck) => truck.status !== 'ignored')
    const truckRows = calculateProfitabilityRows(entries, trips, 'truck')
    const garageRows = calculateProfitabilityRows(entries, trips, 'garage')
    const bestTruck = truckRows[0] ?? null
    const worstMarginTruck = [...truckRows]
      .filter((row) => row.marginPercent != null)
      .sort((left, right) => (left.marginPercent ?? 0) - (right.marginPercent ?? 0))[0] ?? null
    const mostActiveGarage = [...garageRows].sort((left, right) => right.miles - left.miles)[0] ?? null
    const fuelUsed = trips.reduce((sum, trip) => sum + trip.fuelUsedGal, 0)
    const avgMpg = fuelUsed > 0 ? trips.reduce((sum, trip) => sum + trip.distanceMi, 0) / fuelUsed : null
    const maintenanceDue = trucks.filter((truck) =>
      hasMaintenanceAttention(
        evaluateTruckMaintenanceStatuses(
          truck,
          this.repositories.maintenanceRules.list(),
          this.repositories.maintenanceEvents.listByTruckId(truck.id),
        ),
      ),
    ).length

    return {
      type: 'monthly_carrier_snapshot',
      title: `Monthly Carrier Snapshot • ${selectedMonth}`,
      generatedAt: nowIso(),
      subjectLabel: 'Monthly operating view',
      summaryItems: [
        { label: 'Revenue', value: formatCurrency(totals.grossRevenueCents) },
        { label: 'Expenses', value: formatCurrency(-totals.totalExpensesCents) },
        { label: 'Net profit', value: formatCurrency(totals.netProfitCents) },
        { label: 'Miles', value: formatMiles(totals.totalMiles) },
        { label: 'Fuel used', value: `${fuelUsed.toFixed(2)} gal` },
        { label: 'Average MPG', value: avgMpg != null ? avgMpg.toFixed(2) : '--' },
        { label: 'Maintenance due', value: String(maintenanceDue) },
        { label: 'Best truck', value: bestTruck ? this.repositories.trucks.get(bestTruck.id)?.displayName ?? bestTruck.label : '--' },
        { label: 'Worst margin truck', value: worstMarginTruck ? this.repositories.trucks.get(worstMarginTruck.id)?.displayName ?? worstMarginTruck.label : '--' },
        { label: 'Most active garage', value: mostActiveGarage ? this.repositories.garages.get(mostActiveGarage.id)?.name ?? mostActiveGarage.label : '--' },
      ],
      sections: [
        {
          kind: 'metrics',
          title: 'Operational metrics',
          items: [
            { label: 'Sessions logged', value: String(sessions.length) },
            { label: 'Completed trips', value: String(trips.length) },
            { label: 'Operating margin', value: totals.operatingMarginPercent != null ? `${totals.operatingMarginPercent.toFixed(1)}%` : '--' },
            { label: 'Fuel cost / mile', value: totals.fuelCostPerMile != null ? `$${totals.fuelCostPerMile.toFixed(2)}` : '--' },
          ],
        },
        {
          kind: 'notes',
          title: 'Recommended operational notes',
          items: buildMonthlyNotes({
            totals,
            trips,
            entries,
            maintenanceDue,
            bestTruck: bestTruck ? this.repositories.trucks.get(bestTruck.id)?.displayName ?? bestTruck.label : null,
            worstMarginTruck: worstMarginTruck ? this.repositories.trucks.get(worstMarginTruck.id)?.displayName ?? worstMarginTruck.label : null,
            mostActiveGarage: mostActiveGarage ? this.repositories.garages.get(mostActiveGarage.id)?.name ?? mostActiveGarage.label : null,
          }),
        },
      ],
    }
  }
}

function collectAvailableMonths(input: {
  trips: TripRecord[]
  sessions: SessionRecord[]
  entries: FinanceEntryRecord[]
}): Set<string> {
  const months = new Set<string>()
  for (const trip of input.trips) {
    months.add(trip.startedAt.slice(0, 7))
  }
  for (const session of input.sessions) {
    months.add(session.startedAt.slice(0, 7))
  }
  for (const entry of input.entries) {
    months.add(entry.occurredAt.slice(0, 7))
  }
  return new Set([...months].sort().reverse())
}

function buildMonthlyNotes(input: {
  totals: ReturnType<typeof calculateFinanceTotals>
  trips: TripRecord[]
  entries: FinanceEntryRecord[]
  maintenanceDue: number
  bestTruck: string | null
  worstMarginTruck: string | null
  mostActiveGarage: string | null
}): string[] {
  const notes: string[] = []

  if (input.entries.some((entry) => entry.category === 'revenue') === false) {
    notes.push('No revenue entries were recorded this month. Review completed trips for manual income correction where needed.')
  }
  if (input.maintenanceDue > 0) {
    notes.push(`${input.maintenanceDue} truck maintenance items are due or due soon. Schedule service before the next high-mile run.`)
  }
  if (input.totals.operatingMarginPercent != null && input.totals.operatingMarginPercent < 20) {
    notes.push('Operating margin is thin for the month. Review fuel, insurance, and repair costs against route selection.')
  }
  if (input.bestTruck) {
    notes.push(`Best truck by net result: ${input.bestTruck}.`)
  }
  if (input.worstMarginTruck) {
    notes.push(`Lowest margin truck in the month: ${input.worstMarginTruck}.`)
  }
  if (input.mostActiveGarage) {
    notes.push(`Most active garage in the month: ${input.mostActiveGarage}.`)
  }
  if (input.trips.length === 0) {
    notes.push('No completed trips were recorded in the selected month.')
  }

  return notes.length > 0 ? notes : ['No operational exceptions were detected from the stored monthly data.']
}

function formatCurrency(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(amountCents) / 100).toFixed(2)}`
}

function formatMiles(value: number): string {
  return `${value.toFixed(0)} mi`
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatMaintenanceStatus(status: 'due_now' | 'due_soon' | 'current'): string {
  if (status === 'due_now') {
    return 'Due Now'
  }
  if (status === 'due_soon') {
    return 'Due Soon'
  }
  return 'Current'
}

function nowIso(): string {
  return new Date().toISOString()
}

function mostCommon(items: string[]): string | null {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  let leader: string | null = null
  let max = 0
  for (const [item, count] of counts) {
    if (count > max) {
      leader = item
      max = count
    }
  }
  return leader
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
