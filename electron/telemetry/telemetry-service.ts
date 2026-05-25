import type { SettingsRepository } from '../db/repositories/settings-repository'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryProvider,
  TelemetryServiceSnapshot,
  TelemetryStatus,
} from '../../src/lib/telemetry/contracts'
import { MockTelemetryProvider } from './mock-telemetry-provider'
import { TruckSimTelemetryProvider } from './trucksim-telemetry-provider'

const MOCK_TELEMETRY_SETTING_KEY = 'telemetry.mock_enabled'

export class TelemetryService {
  private readonly settingsRepository: SettingsRepository
  private provider: TelemetryProvider | null = null
  private providerId = 'trucksim'
  private status: TelemetryStatus = 'disconnected'
  private currentFrame: NormalizedTelemetryFrame | null = null
  private lastError: string | null = null
  private mockMode = false
  private readonly frameListeners = new Set<
    (frame: NormalizedTelemetryFrame) => void
  >()
  private readonly eventListeners = new Set<
    (event: NormalizedTelemetryEvent) => void
  >()
  private readonly stateListeners = new Set<
    (snapshot: TelemetryServiceSnapshot) => void
  >()
  private unsubscribeFrame: (() => void) | null = null
  private unsubscribeEvent: (() => void) | null = null

  public constructor(settingsRepository: SettingsRepository) {
    this.settingsRepository = settingsRepository
  }

  public async initialize(): Promise<void> {
    this.mockMode = this.settingsRepository.get(MOCK_TELEMETRY_SETTING_KEY)?.value === 'true'
    await this.activateSelectedProvider()
  }

  public getSnapshot(): TelemetryServiceSnapshot {
    return {
      status: this.status,
      providerId: this.providerId,
      mockMode: this.mockMode,
      lastError: this.lastError,
      currentFrame: this.currentFrame,
    }
  }

  public subscribeFrame(
    callback: (frame: NormalizedTelemetryFrame) => void,
  ): () => void {
    this.frameListeners.add(callback)
    return () => {
      this.frameListeners.delete(callback)
    }
  }

  public subscribeEvent(
    callback: (event: NormalizedTelemetryEvent) => void,
  ): () => void {
    this.eventListeners.add(callback)
    return () => {
      this.eventListeners.delete(callback)
    }
  }

  public subscribeState(
    callback: (snapshot: TelemetryServiceSnapshot) => void,
  ): () => void {
    this.stateListeners.add(callback)
    callback(this.getSnapshot())
    return () => {
      this.stateListeners.delete(callback)
    }
  }

  public async setMockMode(enabled: boolean): Promise<TelemetryServiceSnapshot> {
    if (this.mockMode === enabled) {
      return this.getSnapshot()
    }

    this.mockMode = enabled
    this.settingsRepository.upsert(
      MOCK_TELEMETRY_SETTING_KEY,
      enabled ? 'true' : 'false',
    )

    await this.activateSelectedProvider()
    return this.getSnapshot()
  }

  public async dispose(): Promise<void> {
    await this.detachProvider()
    this.frameListeners.clear()
    this.eventListeners.clear()
    this.stateListeners.clear()
  }

  private async activateSelectedProvider(): Promise<void> {
    await this.detachProvider()

    this.provider = this.mockMode
      ? new MockTelemetryProvider()
      : new TruckSimTelemetryProvider()
    this.providerId = this.mockMode ? 'mock' : 'trucksim'
    this.status = 'disconnected'
    this.currentFrame = null
    this.lastError = null

    this.unsubscribeFrame = this.provider.subscribeFrame((frame) => {
      this.currentFrame = frame
      for (const listener of this.frameListeners) {
        listener(frame)
      }
      this.emitState()
    })

    this.unsubscribeEvent = this.provider.subscribeEvent((event) => {
      if (event.type === 'provider.error') {
        const payload = event.payload as { message?: string } | null
        this.lastError = payload?.message ?? 'Telemetry provider error'
      }

      for (const listener of this.eventListeners) {
        listener(event)
      }

      this.status = this.provider?.getStatus() ?? 'disconnected'
      this.emitState()
    })

    this.status = 'connecting'
    this.emitState()

    await this.provider.connect()
    this.status = this.provider.getStatus()
    this.emitState()
  }

  private async detachProvider(): Promise<void> {
    if (this.unsubscribeFrame) {
      this.unsubscribeFrame()
      this.unsubscribeFrame = null
    }

    if (this.unsubscribeEvent) {
      this.unsubscribeEvent()
      this.unsubscribeEvent = null
    }

    if (this.provider) {
      await this.provider.dispose()
      this.provider = null
    }

    this.status = 'disconnected'
    this.currentFrame = null
  }

  private emitState(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.stateListeners) {
      listener(snapshot)
    }
  }
}
