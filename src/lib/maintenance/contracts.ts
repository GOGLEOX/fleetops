import type {
  FinanceEntryRecord,
  MaintenanceEventRecord,
  MaintenanceRuleRecord,
  TruckRecord,
} from '../persistence/contracts'

export type MaintenanceDueStatus = 'due_now' | 'due_soon' | 'current'

export interface MaintenanceRuleInput {
  ruleId?: string
  name: string
  intervalMiles: number
  intervalEngineHours: number | null
  enabled: boolean
}

export interface MaintenanceEventInput {
  truckId: string
  ruleId: string | null
  performedAt: string
  odometerMi: number
  engineHours: number | null
  costCents: number | null
  notes: string | null
}

export interface TruckMaintenanceStatus {
  truck: TruckRecord
  rule: MaintenanceRuleRecord
  status: MaintenanceDueStatus
  progressPercent: number
  milesSinceService: number
  milesUntilDue: number
  nextDueOdometerMi: number
  baselineOdometerMi: number
  lastEvent: MaintenanceEventRecord | null
}

export interface MaintenanceSnapshot {
  rules: MaintenanceRuleRecord[]
  dueNow: TruckMaintenanceStatus[]
  dueSoon: TruckMaintenanceStatus[]
  current: TruckMaintenanceStatus[]
  recentHistory: Array<{
    event: MaintenanceEventRecord
    truck: TruckRecord | null
    rule: MaintenanceRuleRecord | null
    financeEntry: FinanceEntryRecord | null
  }>
  trucks: TruckRecord[]
}

export interface TruckMaintenanceDetail {
  truck: TruckRecord
  statuses: TruckMaintenanceStatus[]
  history: Array<{
    event: MaintenanceEventRecord
    rule: MaintenanceRuleRecord | null
    financeEntry: FinanceEntryRecord | null
  }>
}
