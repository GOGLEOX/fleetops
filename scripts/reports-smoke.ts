import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'
import { ReportsService } from '../electron/reports/reports-service'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'reports-smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()

const truck = database.repositories.trucks.create({
  displayName: 'Kenworth T680',
  detectedMake: 'Kenworth',
  detectedModel: 'T680',
  detectedConfigHash: 'reports-smoke-truck',
  vinHash: null,
  firstSeenAt: '2026-05-01T08:00:00.000Z',
  lastSeenAt: '2026-05-18T16:00:00.000Z',
  startingOdometerMi: 120000,
  currentOdometerMi: 121240,
  engineHours: 500,
  idleHours: 20,
  fuelUsedGal: 220,
  status: 'active',
  notes: 'Reports smoke truck.',
})

const garage = database.repositories.garages.create({
  name: 'Mountain Route Base',
  city: 'Cheyenne',
  state: 'WY',
  divisionName: 'Mountain Division',
  manuallyCreated: true,
  notes: 'Reports smoke garage.',
})

database.repositories.truckGarageAssignments.upsert({
  truckId: truck.id,
  garageId: garage.id,
  assignedAt: '2026-05-01T08:00:00.000Z',
  notes: 'Home yard',
})

const trip = database.repositories.trips.create({
  truckId: truck.id,
  garageId: garage.id,
  startedAt: '2026-05-18T09:00:00.000Z',
  endedAt: '2026-05-18T14:00:00.000Z',
  originCity: 'Cheyenne',
  destinationCity: 'Casper',
  cargoName: 'Steel coils',
  revenueCents: 142000,
  distanceMi: 340,
  fuelUsedGal: 41,
  avgMpg: 8.29,
  idleMinutes: 16,
  damageStart: 0.01,
  damageEnd: 0.02,
  status: 'completed',
  notes: 'Reports smoke trip.',
})

const session = database.repositories.sessionRecords.create({
  truckId: truck.id,
  tripId: trip.id,
  startedAt: '2026-05-18T09:00:00.000Z',
  endedAt: '2026-05-18T14:00:00.000Z',
  status: 'completed',
  source: 'telemetry',
  inferred: false,
  distanceMi: 340,
  fuelUsedGal: 41,
  idleMinutes: 16,
  lastFrameAt: '2026-05-18T14:00:00.000Z',
  notes: 'Reports smoke session.',
})

database.repositories.financeEntries.create({
  tripId: trip.id,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-05-18T14:00:00.000Z',
  category: 'revenue',
  amountCents: 142000,
  description: 'Trip revenue: Steel coils',
  source: 'telemetry',
})
database.repositories.financeEntries.create({
  tripId: trip.id,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-05-18T10:30:00.000Z',
  category: 'fuel',
  amountCents: -16800,
  description: 'Fuel stop',
  source: 'manual',
})
database.repositories.maintenanceEvents.create({
  truckId: truck.id,
  ruleId: 'oil-service',
  performedAt: '2026-05-10T12:00:00.000Z',
  odometerMi: 120600,
  engineHours: 480,
  costCents: 22000,
  notes: 'Oil service',
  source: 'manual',
})
database.repositories.financeEntries.create({
  tripId: null,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-05-10T12:00:00.000Z',
  category: 'maintenance',
  amountCents: -22000,
  description: 'Oil service',
  source: 'manual',
})

const reportsService = new ReportsService(database.repositories)
const generatedReports = [
  reportsService.generateReport({ type: 'trip_sheet', tripId: trip.id }),
  reportsService.generateReport({
    type: 'driver_session_summary',
    sessionId: session.id,
  }),
  reportsService.generateReport({
    type: 'truck_maintenance_summary',
    truckId: truck.id,
  }),
  reportsService.generateReport({ type: 'fleet_profitability_report' }),
  reportsService.generateReport({
    type: 'garage_operations_report',
    garageId: garage.id,
  }),
  reportsService.generateReport({
    type: 'monthly_carrier_snapshot',
    month: '2026-05',
  }),
]

assert.equal(generatedReports.every(Boolean), true)
assert.equal(database.repositories.reports.list().length, 6)
assert.equal(generatedReports.every((report) => report!.html.includes('<html')), true)

console.log(
  JSON.stringify(
    {
      snapshot: reportsService.getSnapshot(),
      generated: generatedReports.map((report) => ({
        id: report!.record.id,
        type: report!.record.type,
        title: report!.record.title,
      })),
    },
    null,
    2,
  ),
)

database.close()
