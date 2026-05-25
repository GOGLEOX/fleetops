export type RecordSource = 'telemetry' | 'manual' | 'inferred' | 'imported'

export type TruckStatus =
  | 'active'
  | 'parked'
  | 'maintenance'
  | 'retired'
  | 'pending'
  | 'ignored'
export type TripStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type SessionRecordStatus = 'active' | 'completed' | 'abandoned'
export type FinanceCategory =
  | 'revenue'
  | 'fuel'
  | 'maintenance'
  | 'repair'
  | 'loan'
  | 'toll'
  | 'ticket'
  | 'garage'
  | 'insurance'
  | 'other'

export interface DatabaseHealth {
  ok: boolean
  initializedAt: string
  tableCount: number
  migrationCount: number
  maintenanceRuleCount: number
  sampleCrudReady: boolean
}

export interface SettingsRecord {
  key: string
  value: string
  updatedAt: string
}

export interface TruckRecord {
  id: string
  displayName: string
  detectedMake: string | null
  detectedModel: string | null
  detectedConfigHash: string | null
  vinHash: string | null
  firstSeenAt: string
  lastSeenAt: string
  startingOdometerMi: number | null
  currentOdometerMi: number | null
  engineHours: number | null
  idleHours: number | null
  fuelUsedGal: number | null
  status: TruckStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface GarageRecord {
  id: string
  name: string
  city: string
  state: string
  divisionName: string | null
  manuallyCreated: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TruckGarageAssignmentRecord {
  id: string
  truckId: string
  garageId: string
  assignedAt: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TripRecord {
  id: string
  truckId: string
  garageId: string | null
  startedAt: string
  endedAt: string | null
  originCity: string | null
  destinationCity: string | null
  cargoName: string | null
  revenueCents: number | null
  distanceMi: number
  fuelUsedGal: number
  avgMpg: number | null
  idleMinutes: number
  damageStart: number | null
  damageEnd: number | null
  status: TripStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface FuelEventRecord {
  id: string
  tripId: string | null
  truckId: string | null
  occurredAt: string
  gallons: number
  estimatedCostCents: number | null
  locationLabel: string | null
  source: RecordSource
  notes: string | null
}

export interface MaintenanceRuleRecord {
  id: string
  name: string
  intervalMiles: number
  intervalEngineHours: number | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface MaintenanceEventRecord {
  id: string
  truckId: string
  ruleId: string | null
  performedAt: string
  odometerMi: number
  engineHours: number | null
  costCents: number | null
  notes: string | null
  source: RecordSource
}

export interface FinanceEntryRecord {
  id: string
  tripId: string | null
  truckId: string | null
  garageId: string | null
  occurredAt: string
  category: FinanceCategory
  amountCents: number
  description: string
  source: RecordSource
}

export interface ReportRecord {
  id: string
  type: string
  title: string
  generatedAt: string
  payloadJson: string
}

export interface SessionRecord {
  id: string
  truckId: string | null
  tripId: string | null
  startedAt: string
  endedAt: string | null
  status: SessionRecordStatus
  source: RecordSource
  inferred: boolean
  distanceMi: number
  fuelUsedGal: number
  idleMinutes: number
  lastFrameAt: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type NewTruckRecord = Omit<
  TruckRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }
export type NewGarageRecord = Omit<
  GarageRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }
export type NewTripRecord = Omit<
  TripRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }
export type NewTruckGarageAssignmentRecord = Omit<
  TruckGarageAssignmentRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }
export type NewFuelEventRecord = Omit<FuelEventRecord, 'id'> & { id?: string }
export type NewMaintenanceRuleRecord = Omit<
  MaintenanceRuleRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }
export type NewMaintenanceEventRecord = Omit<MaintenanceEventRecord, 'id'> & {
  id?: string
}
export type NewFinanceEntryRecord = Omit<FinanceEntryRecord, 'id'> & {
  id?: string
}
export type NewReportRecord = Omit<ReportRecord, 'id'> & { id?: string }
export type NewSessionRecord = Omit<
  SessionRecord,
  'id' | 'createdAt' | 'updatedAt'
> & { id?: string }

export interface DatabaseAdapter {
  readonly id: string
  open(): Promise<void>
  close(): Promise<void>
}

export interface MigrationRecord {
  version: string
  appliedAtIso: string
}
