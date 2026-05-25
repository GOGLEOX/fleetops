import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryEventListener,
  TelemetryFrameListener,
} from '../../src/lib/telemetry/contracts'

export function createFrameSubscriptionSet() {
  const listeners = new Set<TelemetryFrameListener>()

  return {
    emit(frame: NormalizedTelemetryFrame) {
      for (const listener of listeners) {
        listener(frame)
      }
    },
    subscribe(callback: TelemetryFrameListener) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },
    clear() {
      listeners.clear()
    },
  }
}

export function createEventSubscriptionSet() {
  const listeners = new Set<TelemetryEventListener>()

  return {
    emit(event: NormalizedTelemetryEvent) {
      for (const listener of listeners) {
        listener(event)
      }
    },
    subscribe(callback: TelemetryEventListener) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },
    clear() {
      listeners.clear()
    },
  }
}

export function isoNow(): string {
  return new Date().toISOString()
}
