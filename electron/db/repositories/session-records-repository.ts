import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  NewSessionRecord,
  SessionRecord,
} from '../../../src/lib/persistence/contracts'
import { fromSqliteBoolean, isoNow, toSqliteBoolean } from '../repository-helpers'

function mapSessionRow(row: Record<string, unknown>): SessionRecord {
  return {
    id: String(row.id),
    truckId: (row.truck_id as string | null) ?? null,
    tripId: (row.trip_id as string | null) ?? null,
    startedAt: String(row.started_at),
    endedAt: (row.ended_at as string | null) ?? null,
    status: row.status as SessionRecord['status'],
    source: row.source as SessionRecord['source'],
    inferred: fromSqliteBoolean(Number(row.inferred)),
    distanceMi: Number(row.distance_mi),
    fuelUsedGal: Number(row.fuel_used_gal),
    idleMinutes: Number(row.idle_minutes),
    lastFrameAt: String(row.last_frame_at),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class SessionRecordsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): SessionRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM session_records ORDER BY started_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapSessionRow)
  }

  public get(id: string): SessionRecord | null {
    const row = this.database
      .prepare('SELECT * FROM session_records WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapSessionRow(row) : null
  }

  public findActive(): SessionRecord | null {
    const row = this.database
      .prepare(
        "SELECT * FROM session_records WHERE status = 'active' ORDER BY started_at DESC LIMIT 1",
      )
      .get() as Record<string, unknown> | undefined

    return row ? mapSessionRow(row) : null
  }

  public create(input: NewSessionRecord): SessionRecord {
    const createdAt = isoNow()
    const updatedAt = createdAt
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO session_records (
            id, truck_id, trip_id, started_at, ended_at, status,
            source, inferred, distance_mi, fuel_used_gal, idle_minutes,
            last_frame_at, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.truckId,
        input.tripId,
        input.startedAt,
        input.endedAt,
        input.status,
        input.source,
        toSqliteBoolean(input.inferred),
        input.distanceMi,
        input.fuelUsedGal,
        input.idleMinutes,
        input.lastFrameAt,
        input.notes,
        createdAt,
        updatedAt,
      )

    return this.get(id)!
  }

  public update(id: string, input: NewSessionRecord): SessionRecord | null {
    const updatedAt = isoNow()
    const result = this.database
      .prepare(
        `
          UPDATE session_records
          SET truck_id = ?, trip_id = ?, started_at = ?, ended_at = ?,
              status = ?, source = ?, inferred = ?, distance_mi = ?,
              fuel_used_gal = ?, idle_minutes = ?, last_frame_at = ?,
              notes = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.truckId,
        input.tripId,
        input.startedAt,
        input.endedAt,
        input.status,
        input.source,
        toSqliteBoolean(input.inferred),
        input.distanceMi,
        input.fuelUsedGal,
        input.idleMinutes,
        input.lastFrameAt,
        input.notes,
        updatedAt,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }
}
