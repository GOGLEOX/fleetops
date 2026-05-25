import type { DatabaseHealth } from '../lib/persistence/contracts'

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
