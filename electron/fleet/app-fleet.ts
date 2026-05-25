import { getAppDatabase } from '../db/app-database'
import { getSessionTrackingService } from '../session/app-session'
import { FleetService } from './fleet-service'

let fleetServiceInstance: FleetService | null = null

export function initializeFleetService(): FleetService {
  if (!fleetServiceInstance) {
    fleetServiceInstance = new FleetService(
      getAppDatabase().repositories,
      getSessionTrackingService(),
    )
  }

  return fleetServiceInstance
}

export function getFleetService(): FleetService {
  if (!fleetServiceInstance) {
    throw new Error('Fleet service has not been initialized.')
  }

  return fleetServiceInstance
}
