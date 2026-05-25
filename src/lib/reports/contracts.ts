import type {
  GarageRecord,
  ReportRecord,
  SessionRecord,
  TripRecord,
  TruckRecord,
} from '../persistence/contracts'

export type ReportType =
  | 'trip_sheet'
  | 'driver_session_summary'
  | 'truck_maintenance_summary'
  | 'fleet_profitability_report'
  | 'garage_operations_report'
  | 'monthly_carrier_snapshot'

export interface ReportMetricItem {
  label: string
  value: string
  detail?: string
}

export interface ReportTableSection {
  kind: 'table'
  title: string
  columns: string[]
  rows: string[][]
}

export interface ReportMetricsSection {
  kind: 'metrics'
  title: string
  items: ReportMetricItem[]
}

export interface ReportNotesSection {
  kind: 'notes'
  title: string
  items: string[]
}

export type ReportSection =
  | ReportTableSection
  | ReportMetricsSection
  | ReportNotesSection

export interface ReportDocumentPayload {
  type: ReportType
  title: string
  generatedAt: string
  subjectLabel: string
  summaryItems: ReportMetricItem[]
  sections: ReportSection[]
}

export interface GeneratedReport {
  record: ReportRecord
  payload: ReportDocumentPayload
  html: string
}

export interface ReportGenerateInput {
  type: ReportType
  tripId?: string
  sessionId?: string
  truckId?: string
  garageId?: string
  month?: string
}

export interface ReportsSnapshot {
  savedReports: ReportRecord[]
  trips: TripRecord[]
  sessions: SessionRecord[]
  trucks: TruckRecord[]
  garages: GarageRecord[]
  availableMonths: string[]
}
