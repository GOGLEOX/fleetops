import type { DatabaseHealth } from './lib/persistence/contracts'

declare global {
  interface FleetOpsDesktopApi {
    version: string
    getDatabaseHealth: () => Promise<DatabaseHealth>
  }

  interface Window {
    fleetops?: FleetOpsDesktopApi
  }
}

export {}
