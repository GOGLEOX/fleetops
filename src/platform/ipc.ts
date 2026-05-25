import type { DatabaseHealth } from '../lib/persistence/contracts'
import type {
  FleetSnapshot,
  FleetTruckDetail,
  RegisterDetectedTruckInput,
  UpdateTruckInput,
} from '../lib/fleet/contracts'
import type {
  AssignTripToGarageInput,
  AssignTruckToGarageInput,
  GarageDetail,
  GarageSnapshot,
  GarageUpsertInput,
} from '../lib/garages/contracts'
import type {
  MaintenanceEventInput,
  MaintenanceRuleInput,
  MaintenanceSnapshot,
  TruckMaintenanceDetail,
} from '../lib/maintenance/contracts'
import type { MaintenanceRuleRecord } from '../lib/persistence/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from '../lib/telemetry/contracts'
import type { SessionTrackingSnapshot } from '../lib/session/contracts'

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

export async function getSessionSnapshot(): Promise<SessionTrackingSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getSessionSnapshot()
}

export async function registerPendingTruck(
  truckId: string,
): Promise<SessionTrackingSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.registerPendingTruck(truckId)
}

export async function ignorePendingTruck(
  truckId: string,
): Promise<SessionTrackingSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.ignorePendingTruck(truckId)
}

export async function deferPendingTruck(
  truckId: string,
): Promise<SessionTrackingSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.deferPendingTruck(truckId)
}

export function onSessionState(
  callback: (snapshot: SessionTrackingSnapshot) => void,
): (() => void) | null {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.onSessionState(callback)
}

export async function getFleetSnapshot(): Promise<FleetSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getFleetSnapshot()
}

export async function getTruckDetail(
  truckId: string,
): Promise<FleetTruckDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getTruckDetail(truckId)
}

export async function registerDetectedTruck(
  input: RegisterDetectedTruckInput,
): Promise<FleetTruckDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.registerDetectedTruck(input)
}

export async function updateTruck(
  input: UpdateTruckInput,
): Promise<FleetTruckDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.updateTruck(input)
}

export async function getGarageSnapshot(): Promise<GarageSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getGarageSnapshot()
}

export async function getGarageDetail(
  garageId: string,
): Promise<GarageDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getGarageDetail(garageId)
}

export async function saveGarage(
  input: GarageUpsertInput,
): Promise<GarageDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.saveGarage(input)
}

export async function assignTruckToGarage(
  input: AssignTruckToGarageInput,
): Promise<GarageDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.assignTruckToGarage(input)
}

export async function assignTripToGarage(
  input: AssignTripToGarageInput,
): Promise<GarageDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.assignTripToGarage(input)
}

export async function getMaintenanceSnapshot(): Promise<MaintenanceSnapshot | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getMaintenanceSnapshot()
}

export async function getTruckMaintenanceDetail(
  truckId: string,
): Promise<TruckMaintenanceDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.getTruckMaintenanceDetail(truckId)
}

export async function saveMaintenanceRule(
  input: MaintenanceRuleInput,
): Promise<MaintenanceRuleRecord | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.saveMaintenanceRule(input)
}

export async function logMaintenanceEvent(
  input: MaintenanceEventInput,
): Promise<TruckMaintenanceDetail | null> {
  if (!window.fleetops) {
    return null
  }

  return window.fleetops.logMaintenanceEvent(input)
}
