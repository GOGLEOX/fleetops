import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'
import { MaintenanceService } from '../electron/maintenance/maintenance-service'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'maintenance-smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()

const truck = database.repositories.trucks.create({
  displayName: 'Peterbilt 389',
  detectedMake: 'Peterbilt',
  detectedModel: '389',
  detectedConfigHash: 'maintenance-smoke-truck',
  vinHash: null,
  firstSeenAt: '2026-05-25T08:00:00.000Z',
  lastSeenAt: '2026-05-25T08:00:00.000Z',
  startingOdometerMi: 100000,
  currentOdometerMi: 113000,
  engineHours: 210,
  idleHours: 5,
  fuelUsedGal: 800,
  status: 'active',
  notes: 'Maintenance smoke truck.',
})

const maintenanceService = new MaintenanceService(database.repositories)
const initialSnapshot = maintenanceService.getSnapshot()

assert.equal(initialSnapshot.rules.length >= 5, true)
assert.equal(initialSnapshot.dueSoon.some((item) => item.rule.id === 'oil-service'), true)
assert.equal(initialSnapshot.dueNow.some((item) => item.rule.id === 'tire-inspection'), true)

const detailAfterEvent = maintenanceService.logMaintenanceEvent({
  truckId: truck.id,
  ruleId: 'tire-inspection',
  performedAt: '2026-05-25T16:00:00.000Z',
  odometerMi: 113000,
  engineHours: 211,
  costCents: 42000,
  notes: 'Tire inspection completed.',
})

assert.ok(detailAfterEvent)

const tireStatus = detailAfterEvent!.statuses.find(
  (status) => status.rule.id === 'tire-inspection',
)
assert.ok(tireStatus)
assert.equal(tireStatus!.status, 'current')

const financeEntry = database.repositories.financeEntries
  .listByTruckId(truck.id)
  .find((entry) => entry.category === 'maintenance')
assert.ok(financeEntry)
assert.equal(financeEntry!.amountCents, -42000)

console.log(
  JSON.stringify(
    {
      rules: initialSnapshot.rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        intervalMiles: rule.intervalMiles,
      })),
      dueNow: initialSnapshot.dueNow.map((item) => ({
        truck: item.truck.displayName,
        rule: item.rule.name,
        status: item.status,
      })),
      dueSoon: initialSnapshot.dueSoon.map((item) => ({
        truck: item.truck.displayName,
        rule: item.rule.name,
        status: item.status,
      })),
      latestEvent: detailAfterEvent!.history[0],
      financeEntry,
    },
    null,
    2,
  ),
)

database.close()
