import type {
  FuelEventRecord,
  SessionRecord,
  TripRecord,
  TruckRecord,
} from '../persistence/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryStatus,
} from '../telemetry/contracts'

export interface SessionTrackingSnapshot {
  telemetryStatus: TelemetryStatus
  sessionState: 'idle' | 'tracking' | 'paused'
  activeSession: SessionRecord | null
  activeTrip: TripRecord | null
  activeTruck: TruckRecord | null
  latestFrame: NormalizedTelemetryFrame | null
  latestTelemetryEvent: NormalizedTelemetryEvent | null
  recentFuelEvent: FuelEventRecord | null
  newTruckPrompt:
    | {
        truckId: string
        displayName: string
        detectedMake: string | null
        detectedModel: string | null
      }
    | null
  inferredTrip: boolean
  lastDecisionNote: string | null
}
