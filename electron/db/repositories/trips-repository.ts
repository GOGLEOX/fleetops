import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  NewTripRecord,
  TripRecord,
} from '../../../src/lib/persistence/contracts'
import { isoNow } from '../repository-helpers'

function mapTripRow(row: Record<string, unknown>): TripRecord {
  return {
    id: String(row.id),
    truckId: String(row.truck_id),
    garageId: (row.garage_id as string | null) ?? null,
    startedAt: String(row.started_at),
    endedAt: (row.ended_at as string | null) ?? null,
    originCity: (row.origin_city as string | null) ?? null,
    destinationCity: (row.destination_city as string | null) ?? null,
    cargoName: (row.cargo_name as string | null) ?? null,
    revenueCents: (row.revenue_cents as number | null) ?? null,
    distanceMi: Number(row.distance_mi),
    fuelUsedGal: Number(row.fuel_used_gal),
    avgMpg: (row.avg_mpg as number | null) ?? null,
    idleMinutes: Number(row.idle_minutes),
    damageStart: (row.damage_start as number | null) ?? null,
    damageEnd: (row.damage_end as number | null) ?? null,
    status: row.status as TripRecord['status'],
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class TripsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): TripRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM trips ORDER BY started_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapTripRow)
  }

  public get(id: string): TripRecord | null {
    const row = this.database
      .prepare('SELECT * FROM trips WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapTripRow(row) : null
  }

  public findActiveByTruckId(truckId: string): TripRecord | null {
    const row = this.database
      .prepare(
        "SELECT * FROM trips WHERE truck_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1",
      )
      .get(truckId) as Record<string, unknown> | undefined

    return row ? mapTripRow(row) : null
  }

  public listByTruckId(truckId: string): TripRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM trips WHERE truck_id = ? ORDER BY started_at DESC')
      .all(truckId) as Record<string, unknown>[]

    return rows.map(mapTripRow)
  }

  public create(input: NewTripRecord): TripRecord {
    const createdAt = isoNow()
    const updatedAt = createdAt
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO trips (
            id, truck_id, garage_id, started_at, ended_at, origin_city,
            destination_city, cargo_name, revenue_cents, distance_mi,
            fuel_used_gal, avg_mpg, idle_minutes, damage_start, damage_end,
            status, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.truckId,
        input.garageId,
        input.startedAt,
        input.endedAt,
        input.originCity,
        input.destinationCity,
        input.cargoName,
        input.revenueCents,
        input.distanceMi,
        input.fuelUsedGal,
        input.avgMpg,
        input.idleMinutes,
        input.damageStart,
        input.damageEnd,
        input.status,
        input.notes,
        createdAt,
        updatedAt,
      )

    return this.get(id)!
  }

  public update(id: string, input: NewTripRecord): TripRecord | null {
    const updatedAt = isoNow()
    const result = this.database
      .prepare(
        `
          UPDATE trips
          SET truck_id = ?, garage_id = ?, started_at = ?, ended_at = ?,
              origin_city = ?, destination_city = ?, cargo_name = ?,
              revenue_cents = ?, distance_mi = ?, fuel_used_gal = ?,
              avg_mpg = ?, idle_minutes = ?, damage_start = ?, damage_end = ?,
              status = ?, notes = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.truckId,
        input.garageId,
        input.startedAt,
        input.endedAt,
        input.originCity,
        input.destinationCity,
        input.cargoName,
        input.revenueCents,
        input.distanceMi,
        input.fuelUsedGal,
        input.avgMpg,
        input.idleMinutes,
        input.damageStart,
        input.damageEnd,
        input.status,
        input.notes,
        updatedAt,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM trips WHERE id = ?').run(id)
  }
}
