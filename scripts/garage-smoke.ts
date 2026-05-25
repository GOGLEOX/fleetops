import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'
import { GarageService } from '../electron/garages/garage-service'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'garage-smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()

const garageService = new GarageService(database.repositories)

const truck = database.repositories.trucks.create({
  displayName: 'Freightliner Cascadia',
  detectedMake: 'Freightliner',
  detectedModel: 'Cascadia',
  detectedConfigHash: 'garage-smoke-truck',
  vinHash: null,
  firstSeenAt: '2026-05-25T10:00:00.000Z',
  lastSeenAt: '2026-05-25T10:30:00.000Z',
  startingOdometerMi: 102340,
  currentOdometerMi: 102988,
  engineHours: 12.4,
  idleHours: 1.3,
  fuelUsedGal: 54.2,
  status: 'active',
  notes: 'Garage smoke truck.',
})

const trip = database.repositories.trips.create({
  truckId: truck.id,
  garageId: null,
  startedAt: '2026-05-25T11:00:00.000Z',
  endedAt: '2026-05-25T14:00:00.000Z',
  originCity: 'Bakersfield',
  destinationCity: 'Phoenix',
  cargoName: 'Dry goods',
  revenueCents: 128500,
  distanceMi: 420,
  fuelUsedGal: 38,
  avgMpg: 11.05,
  idleMinutes: 22,
  damageStart: null,
  damageEnd: null,
  status: 'completed',
  notes: 'Manual smoke trip.',
})

const garageDetail = garageService.saveGarage({
  name: 'Central Valley Terminal',
  city: 'Bakersfield',
  state: 'CA',
  divisionName: 'Southwest Division',
  notes: 'Primary smoke-test hub.',
})

assert.ok(garageDetail)

database.repositories.financeEntries.create({
  tripId: trip.id,
  truckId: truck.id,
  garageId: garageDetail!.garage.id,
  occurredAt: '2026-05-25T14:05:00.000Z',
  category: 'fuel',
  amountCents: -18500,
  description: 'Fuel stop',
  source: 'manual',
})

database.repositories.maintenanceEvents.create({
  truckId: truck.id,
  ruleId: null,
  performedAt: '2026-05-25T15:00:00.000Z',
  odometerMi: 102990,
  engineHours: 12.6,
  costCents: -24500,
  notes: 'Service bay inspection',
  source: 'manual',
})

const afterTruckAssignment = garageService.assignTruck({
  truckId: truck.id,
  garageId: garageDetail!.garage.id,
  notes: 'Primary home base',
})

assert.equal(afterTruckAssignment?.assignedTrucks.length, 1)

const afterTripAssignment = garageService.assignTrip({
  tripId: trip.id,
  garageId: garageDetail!.garage.id,
})

assert.ok(afterTripAssignment)
assert.equal(afterTripAssignment!.linkedTrips.length, 1)
assert.equal(afterTripAssignment!.analytics.assignedTruckCount, 1)
assert.equal(afterTripAssignment!.analytics.departingTripCount >= 1, true)
assert.equal(afterTripAssignment!.analytics.revenueCents, 128500)
assert.equal(afterTripAssignment!.tripSuggestions.length, 0)

console.log(
  JSON.stringify(
    {
      garage: afterTripAssignment!.garage,
      analytics: afterTripAssignment!.analytics,
      assignedTruck: afterTripAssignment!.assignedTrucks[0],
      linkedTrip: afterTripAssignment!.linkedTrips[0],
    },
    null,
    2,
  ),
)

database.close()
