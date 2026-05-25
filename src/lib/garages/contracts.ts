import type {
  FinanceEntryRecord,
  GarageRecord,
  MaintenanceEventRecord,
  TripRecord,
  TruckGarageAssignmentRecord,
  TruckRecord,
} from '../persistence/contracts'

export interface GarageUpsertInput {
  garageId?: string
  name: string
  city: string
  state: string
  divisionName: string | null
  notes: string | null
}

export interface AssignTruckToGarageInput {
  truckId: string
  garageId: string
  notes: string | null
}

export interface AssignTripToGarageInput {
  tripId: string
  garageId: string | null
}

export interface GarageSuggestion {
  tripId: string
  city: string
  matchType: 'origin' | 'destination'
  reason: string
}

export interface GarageListItem {
  garage: GarageRecord
  assignedTruckCount: number
  linkedTripCount: number
  revenueCents: number
  lastActivityLabel: string
}

export interface GarageAnalytics {
  departingTripCount: number
  arrivingTripCount: number
  assignedTruckCount: number
  revenueCents: number
  fuelSpendCents: number
  maintenanceCostCents: number
  averageOperatingMarginPercent: number | null
  mostCommonCargo: string | null
  lastActivityLabel: string
}

export interface GarageDetail {
  garage: GarageRecord
  analytics: GarageAnalytics
  assignedTrucks: TruckRecord[]
  truckAssignments: TruckGarageAssignmentRecord[]
  linkedTrips: TripRecord[]
  departingTrips: TripRecord[]
  arrivingTrips: TripRecord[]
  financeEntries: FinanceEntryRecord[]
  maintenanceEvents: MaintenanceEventRecord[]
  tripSuggestions: GarageSuggestion[]
  availableTrucks: TruckRecord[]
  availableTrips: TripRecord[]
}

export interface GarageSnapshot {
  garages: GarageListItem[]
}
