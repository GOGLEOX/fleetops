import type { DatabaseHealth } from './lib/persistence/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from './lib/telemetry/contracts'

declare global {
  interface FleetOpsDesktopApi {
    version: string
    getDatabaseHealth: () => Promise<DatabaseHealth>
    getTelemetrySnapshot: () => Promise<TelemetryServiceSnapshot>
    setMockTelemetryEnabled: (
      enabled: boolean,
    ) => Promise<TelemetryServiceSnapshot>
    onTelemetryState: (
      callback: (snapshot: TelemetryServiceSnapshot) => void,
    ) => () => void
    onTelemetryFrame: (
      callback: (frame: NormalizedTelemetryFrame) => void,
    ) => () => void
    onTelemetryEvent: (
      callback: (event: NormalizedTelemetryEvent) => void,
    ) => () => void
  }

  interface Window {
    fleetops?: FleetOpsDesktopApi
  }
}

export {}
