import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'
import { FinanceService } from '../electron/finance/finance-service'
import {
  calculateFinanceTotals,
  calculateProfitabilityRows,
} from '../src/lib/finance/calculations'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'finance-smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()

const financeService = new FinanceService(database.repositories)

const truck = database.repositories.trucks.create({
  displayName: 'Volvo VNL',
  detectedMake: 'Volvo',
  detectedModel: 'VNL',
  detectedConfigHash: 'finance-smoke-truck',
  vinHash: null,
  firstSeenAt: '2026-05-25T08:00:00.000Z',
  lastSeenAt: '2026-05-25T12:00:00.000Z',
  startingOdometerMi: 90000,
  currentOdometerMi: 90380,
  engineHours: 100,
  idleHours: 4,
  fuelUsedGal: 60,
  status: 'active',
  notes: 'Finance smoke truck.',
})

const garage = database.repositories.garages.create({
  name: 'Pacific Yard',
  city: 'Fresno',
  state: 'CA',
  divisionName: 'Central Valley Division',
  manuallyCreated: true,
  notes: 'Finance smoke garage.',
})

const trip = database.repositories.trips.create({
  truckId: truck.id,
  garageId: garage.id,
  startedAt: '2026-05-25T09:00:00.000Z',
  endedAt: '2026-05-25T14:00:00.000Z',
  originCity: 'Fresno',
  destinationCity: 'Reno',
  cargoName: 'Produce',
  revenueCents: 185000,
  distanceMi: 380,
  fuelUsedGal: 46,
  avgMpg: 8.26,
  idleMinutes: 18,
  damageStart: null,
  damageEnd: null,
  status: 'completed',
  notes: 'Finance smoke trip.',
})

database.repositories.financeEntries.create({
  tripId: trip.id,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-05-25T14:05:00.000Z',
  category: 'revenue',
  amountCents: 185000,
  description: 'Trip revenue: Produce',
  source: 'telemetry',
})

const createdFuelEntry = financeService.saveEntry({
  tripId: trip.id,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-05-25T10:30:00.000Z',
  category: 'fuel',
  amountCents: -16250,
  description: 'Fuel stop',
})

assert.ok(createdFuelEntry)

const createdInsuranceEntry = financeService.saveEntry({
  tripId: null,
  truckId: truck.id,
  garageId: null,
  occurredAt: '2026-05-25T00:00:00.000Z',
  category: 'insurance',
  amountCents: -32000,
  description: 'Weekly insurance',
})

assert.ok(createdInsuranceEntry)

const updatedInsuranceEntry = financeService.saveEntry({
  entryId: createdInsuranceEntry!.id,
  tripId: null,
  truckId: truck.id,
  garageId: null,
  occurredAt: '2026-05-25T00:00:00.000Z',
  category: 'insurance',
  amountCents: -30000,
  description: 'Adjusted insurance',
})

assert.ok(updatedInsuranceEntry)

const deleted = financeService.deleteEntry(createdFuelEntry!.id)
assert.equal(deleted, true)

const snapshot = financeService.getSnapshot()
const totals = calculateFinanceTotals(snapshot.entries, snapshot.trips)
const truckProfitability = calculateProfitabilityRows(
  snapshot.entries,
  snapshot.trips,
  'truck',
)

assert.equal(snapshot.entries.some((entry) => entry.category === 'revenue'), true)
assert.equal(snapshot.entries.some((entry) => entry.id === createdFuelEntry!.id), false)
assert.equal(totals.grossRevenueCents, 185000)
assert.equal(totals.totalExpensesCents, 30000)
assert.equal(totals.netProfitCents, 155000)
assert.equal(truckProfitability[0]?.netProfitCents, 155000)

console.log(
  JSON.stringify(
    {
      totals,
      entries: snapshot.entries,
      truckProfitability,
    },
    null,
    2,
  ),
)

database.close()
