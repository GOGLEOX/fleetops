import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()

const truck = database.repositories.trucks.create({
  id: 'truck-smoke',
  displayName: 'Primary Unit',
  detectedMake: 'Kenworth',
  detectedModel: 'W900',
  detectedConfigHash: 'cfg-smoke',
  vinHash: 'vin-smoke',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  startingOdometerMi: 100000,
  currentOdometerMi: 100150,
  engineHours: 4000,
  idleHours: 120,
  fuelUsedGal: 45.5,
  status: 'active',
  notes: 'Smoke test truck',
})

const garage = database.repositories.garages.create({
  id: 'garage-smoke',
  name: 'Flagship Yard',
  city: 'Cheyenne',
  state: 'WY',
  divisionName: 'Plains',
  manuallyCreated: true,
  notes: 'Smoke test garage',
})

const trip = database.repositories.trips.create({
  id: 'trip-smoke',
  truckId: truck.id,
  garageId: garage.id,
  startedAt: '2026-01-02T00:00:00.000Z',
  endedAt: '2026-01-02T08:00:00.000Z',
  originCity: 'Cheyenne',
  destinationCity: 'Rawlins',
  cargoName: 'Palletized goods',
  revenueCents: 125000,
  distanceMi: 180,
  fuelUsedGal: 24,
  avgMpg: 7.5,
  idleMinutes: 18,
  damageStart: 0,
  damageEnd: 0.5,
  status: 'completed',
  notes: 'Smoke test trip',
})

const financeEntry = database.repositories.financeEntries.create({
  id: 'finance-smoke',
  tripId: trip.id,
  truckId: truck.id,
  garageId: garage.id,
  occurredAt: '2026-01-02T08:05:00.000Z',
  category: 'trip_revenue',
  amountCents: 125000,
  description: 'Completed delivery',
  source: 'manual',
})

assert.equal(database.repositories.maintenanceRules.list().length > 0, true)
assert.equal(database.repositories.trucks.get(truck.id)?.displayName, 'Primary Unit')
assert.equal(database.repositories.garages.get(garage.id)?.city, 'Cheyenne')
assert.equal(database.repositories.trips.get(trip.id)?.destinationCity, 'Rawlins')
assert.equal(
  database.repositories.financeEntries.get(financeEntry.id)?.amountCents,
  125000,
)

console.log(
  JSON.stringify(
    {
      health: database.getHealth(),
      truck,
      garage,
      trip,
      financeEntry,
    },
    null,
    2,
  ),
)

database.close()
