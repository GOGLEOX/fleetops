import type Database from 'better-sqlite3'
import { FinanceEntriesRepository } from './finance-entries-repository'
import { FuelEventsRepository } from './fuel-events-repository'
import { GaragesRepository } from './garages-repository'
import { MaintenanceEventsRepository } from './maintenance-events-repository'
import { MaintenanceRulesRepository } from './maintenance-rules-repository'
import { ReportsRepository } from './reports-repository'
import { SessionRecordsRepository } from './session-records-repository'
import { SettingsRepository } from './settings-repository'
import { TripsRepository } from './trips-repository'
import { TruckGarageAssignmentsRepository } from './truck-garage-assignments-repository'
import { TrucksRepository } from './trucks-repository'

export interface FleetOpsRepositories {
  settings: SettingsRepository
  trucks: TrucksRepository
  garages: GaragesRepository
  truckGarageAssignments: TruckGarageAssignmentsRepository
  trips: TripsRepository
  fuelEvents: FuelEventsRepository
  maintenanceRules: MaintenanceRulesRepository
  maintenanceEvents: MaintenanceEventsRepository
  financeEntries: FinanceEntriesRepository
  reports: ReportsRepository
  sessionRecords: SessionRecordsRepository
}

export function createRepositories(
  database: Database.Database,
): FleetOpsRepositories {
  return {
    settings: new SettingsRepository(database),
    trucks: new TrucksRepository(database),
    garages: new GaragesRepository(database),
    truckGarageAssignments: new TruckGarageAssignmentsRepository(database),
    trips: new TripsRepository(database),
    fuelEvents: new FuelEventsRepository(database),
    maintenanceRules: new MaintenanceRulesRepository(database),
    maintenanceEvents: new MaintenanceEventsRepository(database),
    financeEntries: new FinanceEntriesRepository(database),
    reports: new ReportsRepository(database),
    sessionRecords: new SessionRecordsRepository(database),
  }
}
