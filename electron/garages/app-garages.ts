import { getAppDatabase } from '../db/app-database'
import { GarageService } from './garage-service'

let garageServiceInstance: GarageService | null = null

export function initializeGarageService(): GarageService {
  if (!garageServiceInstance) {
    garageServiceInstance = new GarageService(getAppDatabase().repositories)
  }

  return garageServiceInstance
}

export function getGarageService(): GarageService {
  if (!garageServiceInstance) {
    throw new Error('Garage service has not been initialized.')
  }

  return garageServiceInstance
}
