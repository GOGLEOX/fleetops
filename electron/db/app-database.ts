import path from 'node:path'
import { app } from 'electron'
import { createFleetOpsDatabase, type FleetOpsDatabase } from './fleetops-database'

let databaseInstance: FleetOpsDatabase | null = null

function resolveAppDatabasePath(): string {
  return path.join(app.getPath('userData'), 'fleetops.sqlite')
}

export function initializeAppDatabase(): FleetOpsDatabase {
  if (!databaseInstance) {
    databaseInstance = createFleetOpsDatabase({
      databasePath: resolveAppDatabasePath(),
    })
    databaseInstance.initialize()
  }

  return databaseInstance
}

export function getAppDatabase(): FleetOpsDatabase {
  return initializeAppDatabase()
}

export function closeAppDatabase(): void {
  if (databaseInstance) {
    databaseInstance.close()
    databaseInstance = null
  }
}
