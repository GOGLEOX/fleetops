import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  NewTruckRecord,
  TruckRecord,
} from '../../../src/lib/persistence/contracts'
import { isoNow } from '../repository-helpers'

function mapTruckRow(row: Record<string, unknown>): TruckRecord {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    detectedMake: (row.detected_make as string | null) ?? null,
    detectedModel: (row.detected_model as string | null) ?? null,
    detectedConfigHash: (row.detected_config_hash as string | null) ?? null,
    vinHash: (row.vin_hash as string | null) ?? null,
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
    startingOdometerMi: (row.starting_odometer_mi as number | null) ?? null,
    currentOdometerMi: (row.current_odometer_mi as number | null) ?? null,
    engineHours: (row.engine_hours as number | null) ?? null,
    idleHours: (row.idle_hours as number | null) ?? null,
    fuelUsedGal: (row.fuel_used_gal as number | null) ?? null,
    status: row.status as TruckRecord['status'],
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class TrucksRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): TruckRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM trucks ORDER BY updated_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapTruckRow)
  }

  public get(id: string): TruckRecord | null {
    const row = this.database
      .prepare('SELECT * FROM trucks WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapTruckRow(row) : null
  }

  public create(input: NewTruckRecord): TruckRecord {
    const createdAt = isoNow()
    const updatedAt = createdAt
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO trucks (
            id, display_name, detected_make, detected_model, detected_config_hash,
            vin_hash, first_seen_at, last_seen_at, starting_odometer_mi,
            current_odometer_mi, engine_hours, idle_hours, fuel_used_gal,
            status, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.displayName,
        input.detectedMake,
        input.detectedModel,
        input.detectedConfigHash,
        input.vinHash,
        input.firstSeenAt,
        input.lastSeenAt,
        input.startingOdometerMi,
        input.currentOdometerMi,
        input.engineHours,
        input.idleHours,
        input.fuelUsedGal,
        input.status,
        input.notes,
        createdAt,
        updatedAt,
      )

    return this.get(id)!
  }

  public update(id: string, input: NewTruckRecord): TruckRecord | null {
    const updatedAt = isoNow()

    const result = this.database
      .prepare(
        `
          UPDATE trucks
          SET display_name = ?, detected_make = ?, detected_model = ?,
              detected_config_hash = ?, vin_hash = ?, first_seen_at = ?,
              last_seen_at = ?, starting_odometer_mi = ?, current_odometer_mi = ?,
              engine_hours = ?, idle_hours = ?, fuel_used_gal = ?, status = ?,
              notes = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.displayName,
        input.detectedMake,
        input.detectedModel,
        input.detectedConfigHash,
        input.vinHash,
        input.firstSeenAt,
        input.lastSeenAt,
        input.startingOdometerMi,
        input.currentOdometerMi,
        input.engineHours,
        input.idleHours,
        input.fuelUsedGal,
        input.status,
        input.notes,
        updatedAt,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM trucks WHERE id = ?').run(id)
  }
}
