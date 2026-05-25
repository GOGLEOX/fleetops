import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryProvider,
  TelemetryStatus,
} from '../../src/lib/telemetry/contracts'
import {
  createEventSubscriptionSet,
  createFrameSubscriptionSet,
  isoNow,
} from './provider-utils'

export class TruckSimTelemetryProvider implements TelemetryProvider {
  private status: TelemetryStatus = 'disconnected'
  private readonly frames = createFrameSubscriptionSet()
  private readonly events = createEventSubscriptionSet()
  private lastError: string | null = null

  public async connect(): Promise<void> {
    if (this.status === 'connected') {
      return
    }

    this.status = 'connecting'

    try {
      // TODO: Integrate a real TruckSim telemetry bridge here.
      // This placeholder deliberately fails safely until the bridge is chosen.
      throw new Error(
        'TruckSim telemetry bridge is not installed. Enable mock telemetry or add a supported bridge implementation.',
      )
    } catch (error) {
      this.status = 'error'
      this.lastError =
        error instanceof Error ? error.message : 'Unknown telemetry error'

      this.events.emit({
        timestamp: isoNow(),
        type: 'provider.error',
        payload: {
          provider: 'trucksim',
          message: this.lastError,
        },
      })
    }
  }

  public async disconnect(): Promise<void> {
    this.status = 'disconnected'
  }

  public getStatus(): TelemetryStatus {
    return this.status
  }

  public subscribeFrame(callback: (frame: NormalizedTelemetryFrame) => void) {
    return this.frames.subscribe(callback)
  }

  public subscribeEvent(callback: (event: NormalizedTelemetryEvent) => void) {
    return this.events.subscribe(callback)
  }

  public async dispose(): Promise<void> {
    await this.disconnect()
    this.frames.clear()
    this.events.clear()
  }

  public getLastError(): string | null {
    return this.lastError
  }
}
