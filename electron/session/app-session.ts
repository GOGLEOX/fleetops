import { getAppDatabase } from '../db/app-database'
import { getTelemetryService } from '../telemetry/app-telemetry'
import { SessionTrackingService } from './session-tracking-service'

let sessionTrackingServiceInstance: SessionTrackingService | null = null

export async function initializeSessionTrackingService(): Promise<SessionTrackingService> {
  if (!sessionTrackingServiceInstance) {
    sessionTrackingServiceInstance = new SessionTrackingService(
      getTelemetryService(),
      getAppDatabase().repositories,
    )
    await sessionTrackingServiceInstance.initialize()
  }

  return sessionTrackingServiceInstance
}

export function getSessionTrackingService(): SessionTrackingService {
  if (!sessionTrackingServiceInstance) {
    throw new Error('Session tracking service has not been initialized.')
  }

  return sessionTrackingServiceInstance
}

export async function closeSessionTrackingService(): Promise<void> {
  if (sessionTrackingServiceInstance) {
    await sessionTrackingServiceInstance.dispose()
    sessionTrackingServiceInstance = null
  }
}
