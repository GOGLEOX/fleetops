import type { DatabaseHealth } from '../lib/persistence/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from '../lib/telemetry/contracts'

export interface DesktopRuntimeInfo {
  version: string
}

export function getDesktopRuntimeInfo(): DesktopRuntimeInfo | null {
  if (!window.fleetops) {
    return null
  }

  return {
    version: window.fleetops.version,
  }
}

export async function getDatabaseHealth(): Promise<DatabaseHealth | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getDatabaseHealth()
}

export async function getTelemetrySnapshot(): Promise<TelemetryServiceSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getTelemetrySnapshot()
}

export async function setMockTelemetryEnabled(
  enabled: boolean,
): Promise<TelemetryServiceSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.setMockTelemetryEnabled(enabled)
}

export function onTelemetryState(
  callback: (snapshot: TelemetryServiceSnapshot) => void,
): (() => void) | null {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.onTelemetryState(callback)
}

export function onTelemetryFrame(
  callback: (frame: NormalizedTelemetryFrame) => void,
): (() => void) | null {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.onTelemetryFrame(callback)
}

export function onTelemetryEvent(
  callback: (event: NormalizedTelemetryEvent) => void,
): (() => void) | null {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.onTelemetryEvent(callback)
}
