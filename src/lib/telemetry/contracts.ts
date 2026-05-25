export interface TelemetrySnapshot {
  gameTime?: string
  truckMake?: string
  truckModel?: string
  speedMph?: number
  fuelGallons?: number
  odometerMiles?: number
  cargoName?: string
  source: 'bridge'
}

export interface TelemetryAdapter {
  readonly id: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  readSnapshot(): Promise<TelemetrySnapshot | null>
}
