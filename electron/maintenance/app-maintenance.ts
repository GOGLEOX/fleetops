import { getAppDatabase } from '../db/app-database'
import { MaintenanceService } from './maintenance-service'

let maintenanceServiceInstance: MaintenanceService | null = null

export function initializeMaintenanceService(): MaintenanceService {
  if (!maintenanceServiceInstance) {
    maintenanceServiceInstance = new MaintenanceService(
      getAppDatabase().repositories,
    )
  }

  return maintenanceServiceInstance
}

export function getMaintenanceService(): MaintenanceService {
  if (!maintenanceServiceInstance) {
    throw new Error('Maintenance service has not been initialized.')
  }

  return maintenanceServiceInstance
}
