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
  private tick = 0

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
      this.tick += 1
      const phase = this.getPhase()
      const speedKph = phase.speedKph
      const engineRpm = phase.engineOn
        ? 1280 + Math.round(Math.cos(Date.now() / 2000) * 140)
        : 0

      if (phase.speedKph > 1) {
        this.odometerKm += 0.42
      }

      this.navigationDistanceKm = phase.jobActive
        ? Math.max(0, this.navigationDistanceKm - (phase.speedKph > 1 ? 0.42 : 0))
        : 0

      if (phase.refuelLiters > 0) {
        this.fuelLiters = Math.min(720, this.fuelLiters + phase.refuelLiters)
      } else if (phase.engineOn) {
        this.fuelLiters = Math.max(0, this.fuelLiters - phase.fuelBurnLiters)
      }

      if (phase.emitJobDelivered) {
        this.emitEvent({
          timestamp: isoNow(),
          type: 'job.delivered',
          payload: {
            provider: 'mock',
          },
        })
      }

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
        engineOn: phase.engineOn,
        gear: phase.speedKph > 1 ? 12 : 0,
        damageTruck: phase.emitJobDelivered ? 0.012 : 0.004,
        damageTrailer: 0,
        jobActive: phase.jobActive,
        cargoName: phase.jobActive ? 'Palletized groceries' : null,
        originCity: phase.jobActive ? 'Casper' : null,
        destinationCity: phase.jobActive ? 'Cheyenne' : null,
        income: phase.jobActive || phase.emitJobDelivered ? 48200 : null,
        routeDistanceKm: phase.jobActive ? 914 : null,
        navigationDistanceKm: Number(this.navigationDistanceKm.toFixed(2)),
        raw: {
          provider: 'mock',
          tick: this.tick,
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

  private getPhase(): {
    speedKph: number
    engineOn: boolean
    jobActive: boolean
    fuelBurnLiters: number
    refuelLiters: number
    emitJobDelivered: boolean
  } {
    if (this.tick <= 2) {
      return {
        speedKph: 0,
        engineOn: true,
        jobActive: false,
        fuelBurnLiters: 0.02,
        refuelLiters: 0,
        emitJobDelivered: false,
      }
    }

    if (this.tick <= 8) {
      return {
        speedKph: 74 + Math.round(Math.sin(Date.now() / 4200) * 4),
        engineOn: true,
        jobActive: true,
        fuelBurnLiters: 0.09,
        refuelLiters: 0,
        emitJobDelivered: false,
      }
    }

    if (this.tick <= 10) {
      return {
        speedKph: 0,
        engineOn: true,
        jobActive: true,
        fuelBurnLiters: 0.03,
        refuelLiters: this.tick === 10 ? 120 : 0,
        emitJobDelivered: false,
      }
    }

    if (this.tick <= 14) {
      return {
        speedKph: 76,
        engineOn: true,
        jobActive: true,
        fuelBurnLiters: 0.08,
        refuelLiters: 0,
        emitJobDelivered: false,
      }
    }

    return {
      speedKph: 0,
      engineOn: true,
      jobActive: false,
      fuelBurnLiters: 0.02,
      refuelLiters: 0,
      emitJobDelivered: this.tick === 15,
    }
  }
}
