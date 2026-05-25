import type {
  FinanceCategory,
  FinanceEntryRecord,
  GarageRecord,
  TripRecord,
  TruckRecord,
} from '../persistence/contracts'

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  'revenue',
  'fuel',
  'maintenance',
  'repair',
  'insurance',
  'loan',
  'garage',
  'toll',
  'ticket',
  'other',
]

export interface FinanceEntryInput {
  entryId?: string
  tripId: string | null
  truckId: string | null
  garageId: string | null
  occurredAt: string
  category: FinanceCategory
  amountCents: number
  description: string
}

export interface FinanceFilters {
  dateFrom: string
  dateTo: string
  truckId: string
  garageId: string
  category: FinanceCategory | 'all'
}

export interface FinanceSnapshot {
  entries: FinanceEntryRecord[]
  trips: TripRecord[]
  trucks: TruckRecord[]
  garages: GarageRecord[]
}

export interface FinanceTotals {
  grossRevenueCents: number
  totalExpensesCents: number
  netProfitCents: number
  revenuePerMile: number | null
  costPerMile: number | null
  fuelCostPerMile: number | null
  maintenanceReservePerMile: number | null
  operatingMarginPercent: number | null
  totalMiles: number
}

export interface ProfitabilityRow {
  id: string
  label: string
  miles: number
  revenueCents: number
  expensesCents: number
  netProfitCents: number
  marginPercent: number | null
}
