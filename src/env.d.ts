import type { DatabaseHealth } from './lib/persistence/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from './lib/telemetry/contracts'
import type { SessionTrackingSnapshot } from './lib/session/contracts'

declare global {
  interface FleetOpsDesktopApi {
    version: string
    getDatabaseHealth: () => Promise<DatabaseHealth>
    getTelemetrySnapshot: () => Promise<TelemetryServiceSnapshot>
    setMockTelemetryEnabled: (
      enabled: boolean,
    ) => Promise<TelemetryServiceSnapshot>
    getSessionSnapshot: () => Promise<SessionTrackingSnapshot>
    registerPendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    ignorePendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    deferPendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    onTelemetryState: (
      callback: (snapshot: TelemetryServiceSnapshot) => void,
    ) => () => void
    onTelemetryFrame: (
      callback: (frame: NormalizedTelemetryFrame) => void,
    ) => () => void
    onTelemetryEvent: (
      callback: (event: NormalizedTelemetryEvent) => void,
    ) => () => void
    onSessionState: (
      callback: (snapshot: SessionTrackingSnapshot) => void,
    ) => () => void
  }

  interface Window {
    fleetops?: FleetOpsDesktopApi
  }
}

export {}
