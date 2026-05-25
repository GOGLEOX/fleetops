import { getAppDatabase } from '../db/app-database'
import { ReportsService } from './reports-service'

let reportsServiceInstance: ReportsService | null = null

export function initializeReportsService(): ReportsService {
  if (!reportsServiceInstance) {
    reportsServiceInstance = new ReportsService(getAppDatabase().repositories)
  }

  return reportsServiceInstance
}

export function getReportsService(): ReportsService {
  if (!reportsServiceInstance) {
    throw new Error('Reports service has not been initialized.')
  }

  return reportsServiceInstance
}
