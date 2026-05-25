import type {
  FinanceEntryRecord,
  FuelEventRecord,
  MaintenanceEventRecord,
  TripRecord,
  TruckRecord,
} from '../persistence/contracts'
import type { TruckMaintenanceStatus } from '../maintenance/contracts'

export interface RegisterDetectedTruckInput {
  truckId: string
  displayName: string
  detectedMake: string | null
  detectedModel: string | null
  startingOdometerMi: number | null
  notes: string | null
}

export interface UpdateTruckInput {
  truckId: string
  displayName: string
  detectedMake: string | null
  detectedModel: string | null
  startingOdometerMi: number | null
  currentOdometerMi: number | null
  notes: string | null
  status: TruckRecord['status']
}

export interface FleetTruckSummary {
  truck: TruckRecord
  avgMpg: number | null
  lastSeenLabel: string
  maintenanceDue: boolean
  maintenanceDueLabel: string
  maintenanceStatuses: TruckMaintenanceStatus[]
  netProfitCents: number
}

export interface FleetTruckDetail {
  truck: TruckRecord
  trips: TripRecord[]
  fuelEvents: FuelEventRecord[]
  maintenanceEvents: MaintenanceEventRecord[]
  financeEntries: FinanceEntryRecord[]
  summary: {
    totalTrips: number
    totalDistanceMi: number
    totalFuelGallons: number
    avgMpg: number | null
    idleHours: number
    lastSeenLabel: string
    netProfitCents: number
    maintenanceDue: boolean
    maintenanceDueLabel: string
    maintenanceStatuses: TruckMaintenanceStatus[]
  }
}

export interface FleetSnapshot {
  trucks: FleetTruckSummary[]
  pendingTruck: TruckRecord | null
}
