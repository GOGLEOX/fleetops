export type TelemetryStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface NormalizedTelemetryFrame {
  timestamp: string
  game: string
  paused: boolean
  truckMake: string | null
  truckModel: string | null
  truckId: string | null
  truckConfigHash: string | null
  odometerKm: number | null
  speedKph: number | null
  fuelLiters: number | null
  fuelCapacityLiters: number | null
  engineRpm: number | null
  engineOn: boolean | null
  gear: number | null
  damageTruck: number | null
  damageTrailer: number | null
  jobActive: boolean | null
  cargoName: string | null
  originCity: string | null
  destinationCity: string | null
  income: number | null
  routeDistanceKm: number | null
  navigationDistanceKm: number | null
  raw: unknown
}

export interface NormalizedTelemetryEvent {
  timestamp: string
  type: string
  payload: unknown
}

export type TelemetryFrameListener = (
  frame: NormalizedTelemetryFrame,
) => void
export type TelemetryEventListener = (
  event: NormalizedTelemetryEvent,
) => void

export interface TelemetryProvider {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getStatus(): TelemetryStatus
  subscribeFrame(callback: TelemetryFrameListener): () => void
  subscribeEvent(callback: TelemetryEventListener): () => void
  dispose(): Promise<void>
}

export interface TelemetryServiceSnapshot {
  status: TelemetryStatus
  providerId: string
  mockMode: boolean
  lastError: string | null
  currentFrame: NormalizedTelemetryFrame | null
}
