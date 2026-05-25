import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'
import { TelemetryService } from '../electron/telemetry/telemetry-service'
import { SessionTrackingService } from '../electron/session/session-tracking-service'

const databaseDirectory = path.join(process.cwd(), '.fleetops')
const databasePath = path.join(databaseDirectory, 'session-smoke.sqlite')

fs.mkdirSync(databaseDirectory, { recursive: true })
if (fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

const database = createFleetOpsDatabase({ databasePath })
database.initialize()
database.repositories.settings.upsert('telemetry.mock_enabled', 'true')

const telemetryService = new TelemetryService(database.repositories.settings)
await telemetryService.initialize()

const sessionService = new SessionTrackingService(
  telemetryService,
  database.repositories,
)
await sessionService.initialize()

await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('Session smoke timeout'))
  }, 24000)

  const unsubscribe = sessionService.subscribeState((snapshot) => {
    if (snapshot.newTruckPrompt) {
      void sessionService.registerPendingTruck(snapshot.newTruckPrompt.truckId)
      return
    }

    const completedTrip = database.repositories.trips
      .list()
      .find((trip) => trip.status === 'completed')
    const recentTruck = database.repositories.trucks.list()[0]
    const recentFuelEvent = database.repositories.fuelEvents.list()[0]

    if (
      completedTrip &&
      recentTruck?.currentOdometerMi != null &&
      recentFuelEvent
    ) {
      clearTimeout(timeout)
      unsubscribe()
      resolve()
    }
  })
})

const trips = database.repositories.trips.list()
const trucks = database.repositories.trucks.list()
const fuelEvents = database.repositories.fuelEvents.list()
const sessions = database.repositories.sessionRecords.list()
const financeEntries = database.repositories.financeEntries.list()

assert.equal(trips.length > 0, true)
assert.equal(trucks.length > 0, true)
assert.equal(fuelEvents.length > 0, true)
assert.equal(sessions.length > 0, true)
assert.equal(trips[0]?.status, 'completed')
assert.equal(
  financeEntries.some(
    (entry) => entry.tripId === trips[0]?.id && entry.category === 'revenue',
  ),
  true,
)

console.log(
  JSON.stringify(
    {
      trip: trips[0],
      truck: trucks[0],
      fuelEvent: fuelEvents[0],
      session: sessions[0],
      revenueEntry: financeEntries.find(
        (entry) => entry.tripId === trips[0]?.id && entry.category === 'revenue',
      ),
    },
    null,
    2,
  ),
)

await sessionService.dispose()
await telemetryService.dispose()
database.close()
