import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  GarageRecord,
  NewGarageRecord,
} from '../../../src/lib/persistence/contracts'
import { fromSqliteBoolean, isoNow, toSqliteBoolean } from '../repository-helpers'

function mapGarageRow(row: Record<string, unknown>): GarageRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    city: String(row.city),
    state: String(row.state),
    divisionName: (row.division_name as string | null) ?? null,
    manuallyCreated: fromSqliteBoolean(Number(row.manually_created)),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class GaragesRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): GarageRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM garages ORDER BY name ASC')
      .all() as Record<string, unknown>[]

    return rows.map(mapGarageRow)
  }

  public get(id: string): GarageRecord | null {
    const row = this.database
      .prepare('SELECT * FROM garages WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapGarageRow(row) : null
  }

  public create(input: NewGarageRecord): GarageRecord {
    const createdAt = isoNow()
    const updatedAt = createdAt
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO garages (
            id, name, city, state, division_name, manually_created,
            notes, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.name,
        input.city,
        input.state,
        input.divisionName,
        toSqliteBoolean(input.manuallyCreated),
        input.notes,
        createdAt,
        updatedAt,
      )

    return this.get(id)!
  }

  public update(id: string, input: NewGarageRecord): GarageRecord | null {
    const updatedAt = isoNow()
    const result = this.database
      .prepare(
        `
          UPDATE garages
          SET name = ?, city = ?, state = ?, division_name = ?,
              manually_created = ?, notes = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.name,
        input.city,
        input.state,
        input.divisionName,
        toSqliteBoolean(input.manuallyCreated),
        input.notes,
        updatedAt,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM garages WHERE id = ?').run(id)
  }
}
