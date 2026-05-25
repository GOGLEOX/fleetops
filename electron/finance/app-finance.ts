import { getAppDatabase } from '../db/app-database'
import { FinanceService } from './finance-service'

let financeServiceInstance: FinanceService | null = null

export function initializeFinanceService(): FinanceService {
  if (!financeServiceInstance) {
    financeServiceInstance = new FinanceService(getAppDatabase().repositories)
  }

  return financeServiceInstance
}

export function getFinanceService(): FinanceService {
  if (!financeServiceInstance) {
    throw new Error('Finance service has not been initialized.')
  }

  return financeServiceInstance
}
