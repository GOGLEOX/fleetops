import type { DatabaseHealth } from './lib/persistence/contracts'
import type {
  FleetSnapshot,
  FleetTruckDetail,
  RegisterDetectedTruckInput,
  UpdateTruckInput,
} from './lib/fleet/contracts'
import type {
  AssignTripToGarageInput,
  AssignTruckToGarageInput,
  GarageDetail,
  GarageSnapshot,
  GarageUpsertInput,
} from './lib/garages/contracts'
import type {
  MaintenanceEventInput,
  MaintenanceRuleInput,
  MaintenanceSnapshot,
  TruckMaintenanceDetail,
} from './lib/maintenance/contracts'
import type {
  FinanceEntryRecord,
  MaintenanceRuleRecord,
} from './lib/persistence/contracts'
import type {
  FinanceEntryInput,
  FinanceSnapshot,
} from './lib/finance/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from './lib/telemetry/contracts'
import type { SessionTrackingSnapshot } from './lib/session/contracts'

declare global {
  interface FleetOpsDesktopApi {
    version: string
    getDatabaseHealth: () => Promise<DatabaseHealth>
    getTelemetrySnapshot: () => Promise<TelemetryServiceSnapshot>
    setMockTelemetryEnabled: (
      enabled: boolean,
    ) => Promise<TelemetryServiceSnapshot>
    getSessionSnapshot: () => Promise<SessionTrackingSnapshot>
    registerPendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    ignorePendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    deferPendingTruck: (truckId: string) => Promise<SessionTrackingSnapshot>
    getFleetSnapshot: () => Promise<FleetSnapshot>
    getTruckDetail: (truckId: string) => Promise<FleetTruckDetail | null>
    registerDetectedTruck: (
      input: RegisterDetectedTruckInput,
    ) => Promise<FleetTruckDetail | null>
    updateTruck: (input: UpdateTruckInput) => Promise<FleetTruckDetail | null>
    getGarageSnapshot: () => Promise<GarageSnapshot>
    getGarageDetail: (garageId: string) => Promise<GarageDetail | null>
    saveGarage: (input: GarageUpsertInput) => Promise<GarageDetail | null>
    assignTruckToGarage: (
      input: AssignTruckToGarageInput,
    ) => Promise<GarageDetail | null>
    assignTripToGarage: (
      input: AssignTripToGarageInput,
    ) => Promise<GarageDetail | null>
    getMaintenanceSnapshot: () => Promise<MaintenanceSnapshot>
    getTruckMaintenanceDetail: (
      truckId: string,
    ) => Promise<TruckMaintenanceDetail | null>
    saveMaintenanceRule: (
      input: MaintenanceRuleInput,
    ) => Promise<MaintenanceRuleRecord | null>
    logMaintenanceEvent: (
      input: MaintenanceEventInput,
    ) => Promise<TruckMaintenanceDetail | null>
    getFinanceSnapshot: () => Promise<FinanceSnapshot>
    saveFinanceEntry: (
      input: FinanceEntryInput,
    ) => Promise<FinanceEntryRecord | null>
    deleteFinanceEntry: (entryId: string) => Promise<boolean>
    onTelemetryState: (
      callback: (snapshot: TelemetryServiceSnapshot) => void,
    ) => () => void
    onTelemetryFrame: (
      callback: (frame: NormalizedTelemetryFrame) => void,
    ) => () => void
    onTelemetryEvent: (
      callback: (event: NormalizedTelemetryEvent) => void,
    ) => () => void
    onSessionState: (
      callback: (snapshot: SessionTrackingSnapshot) => void,
    ) => () => void
  }

  interface Window {
    fleetops?: FleetOpsDesktopApi
  }
}

export {}
