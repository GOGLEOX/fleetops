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

export class MockTelemetryProvider implements TelemetryProvider {
  private status: TelemetryStatus = 'disconnected'
  private readonly frames = createFrameSubscriptionSet()
  private readonly events = createEventSubscriptionSet()
  private frameTimer: NodeJS.Timeout | null = null
  private eventTimer: NodeJS.Timeout | null = null
  private odometerKm = 245_120
  private navigationDistanceKm = 812
  private fuelLiters = 510

  public async connect(): Promise<void> {
    if (this.status === 'connected') {
      return
    }

    this.status = 'connecting'

    await new Promise((resolve) => {
      setTimeout(resolve, 250)
    })

    this.status = 'connected'
    this.emitEvent({
      timestamp: isoNow(),
      type: 'provider.connected',
      payload: {
        provider: 'mock',
      },
    })

    this.frameTimer = setInterval(() => {
      const speedKph = 76 + Math.round(Math.sin(Date.now() / 4200) * 6)
      const engineRpm = 1280 + Math.round(Math.cos(Date.now() / 2000) * 140)

      this.odometerKm += 0.42
      this.navigationDistanceKm = Math.max(0, this.navigationDistanceKm - 0.42)
      this.fuelLiters = Math.max(0, this.fuelLiters - 0.09)

      const frame: NormalizedTelemetryFrame = {
        timestamp: isoNow(),
        game: 'ATS',
        paused: false,
        truckMake: 'Kenworth',
        truckModel: 'W900',
        truckId: 'mock-truck-primary',
        truckConfigHash: 'mock-config-001',
        odometerKm: Number(this.odometerKm.toFixed(2)),
        speedKph,
        fuelLiters: Number(this.fuelLiters.toFixed(2)),
        fuelCapacityLiters: 720,
        engineRpm,
        engineOn: true,
        gear: 12,
        damageTruck: 0.004,
        damageTrailer: 0,
        jobActive: true,
        cargoName: 'Palletized groceries',
        originCity: 'Casper',
        destinationCity: 'Cheyenne',
        income: 48200,
        routeDistanceKm: 914,
        navigationDistanceKm: Number(this.navigationDistanceKm.toFixed(2)),
        raw: {
          provider: 'mock',
        },
      }

      this.frames.emit(frame)
    }, 1000)

    this.eventTimer = setInterval(() => {
      this.emitEvent({
        timestamp: isoNow(),
        type: 'session.marker',
        payload: {
          note: 'Mock telemetry heartbeat',
        },
      })
    }, 7000)
  }

  public async disconnect(): Promise<void> {
    if (this.frameTimer) {
      clearInterval(this.frameTimer)
      this.frameTimer = null
    }

    if (this.eventTimer) {
      clearInterval(this.eventTimer)
      this.eventTimer = null
    }

    this.status = 'disconnected'
    this.emitEvent({
      timestamp: isoNow(),
      type: 'provider.disconnected',
      payload: {
        provider: 'mock',
      },
    })
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

  private emitEvent(event: NormalizedTelemetryEvent) {
    this.events.emit(event)
  }
}
