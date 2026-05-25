import { getAppDatabase } from '../db/app-database'
import { TelemetryService } from './telemetry-service'

let telemetryServiceInstance: TelemetryService | null = null

export async function initializeTelemetryService(): Promise<TelemetryService> {
  if (!telemetryServiceInstance) {
    telemetryServiceInstance = new TelemetryService(
      getAppDatabase().repositories.settings,
    )
    await telemetryServiceInstance.initialize()
  }

  return telemetryServiceInstance
}

export function getTelemetryService(): TelemetryService {
  if (!telemetryServiceInstance) {
    throw new Error('Telemetry service has not been initialized.')
  }

  return telemetryServiceInstance
}

export async function closeTelemetryService(): Promise<void> {
  if (telemetryServiceInstance) {
    await telemetryServiceInstance.dispose()
    telemetryServiceInstance = null
  }
}
