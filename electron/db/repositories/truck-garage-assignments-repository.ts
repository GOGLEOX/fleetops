import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  NewTruckGarageAssignmentRecord,
  TruckGarageAssignmentRecord,
} from '../../../src/lib/persistence/contracts'
import { isoNow } from '../repository-helpers'

function mapTruckGarageAssignmentRow(
  row: Record<string, unknown>,
): TruckGarageAssignmentRecord {
  return {
    id: String(row.id),
    truckId: String(row.truck_id),
    garageId: String(row.garage_id),
    assignedAt: String(row.assigned_at),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class TruckGarageAssignmentsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): TruckGarageAssignmentRecord[] {
    const rows = this.database
      .prepare(
        'SELECT * FROM truck_garage_assignments ORDER BY assigned_at DESC, created_at DESC',
      )
      .all() as Record<string, unknown>[]

    return rows.map(mapTruckGarageAssignmentRow)
  }

  public getByTruckId(truckId: string): TruckGarageAssignmentRecord | null {
    const row = this.database
      .prepare(
        'SELECT * FROM truck_garage_assignments WHERE truck_id = ? LIMIT 1',
      )
      .get(truckId) as Record<string, unknown> | undefined

    return row ? mapTruckGarageAssignmentRow(row) : null
  }

  public listByGarageId(garageId: string): TruckGarageAssignmentRecord[] {
    const rows = this.database
      .prepare(
        'SELECT * FROM truck_garage_assignments WHERE garage_id = ? ORDER BY assigned_at DESC',
      )
      .all(garageId) as Record<string, unknown>[]

    return rows.map(mapTruckGarageAssignmentRow)
  }

  public upsert(
    input: NewTruckGarageAssignmentRecord,
  ): TruckGarageAssignmentRecord | null {
    const existing = this.getByTruckId(input.truckId)
    const now = isoNow()
    const id = existing?.id ?? input.id ?? randomUUID()
    const createdAt = existing?.createdAt ?? now

    this.database
      .prepare(
        `
          INSERT INTO truck_garage_assignments (
            id, truck_id, garage_id, assigned_at, notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(truck_id) DO UPDATE SET
            garage_id = excluded.garage_id,
            assigned_at = excluded.assigned_at,
            notes = excluded.notes,
            updated_at = excluded.updated_at
        `,
      )
      .run(
        id,
        input.truckId,
        input.garageId,
        input.assignedAt,
        input.notes,
        createdAt,
        now,
      )

    return this.getByTruckId(input.truckId)
  }

  public clearByTruckId(truckId: string): void {
    this.database
      .prepare('DELETE FROM truck_garage_assignments WHERE truck_id = ?')
      .run(truckId)
  }
}
