import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  FinanceEntryRecord,
  NewFinanceEntryRecord,
} from '../../../src/lib/persistence/contracts'

function mapFinanceEntryRow(row: Record<string, unknown>): FinanceEntryRecord {
  return {
    id: String(row.id),
    tripId: (row.trip_id as string | null) ?? null,
    truckId: (row.truck_id as string | null) ?? null,
    garageId: (row.garage_id as string | null) ?? null,
    occurredAt: String(row.occurred_at),
    category: row.category as FinanceEntryRecord['category'],
    amountCents: Number(row.amount_cents),
    description: String(row.description),
    source: row.source as FinanceEntryRecord['source'],
  }
}

export class FinanceEntriesRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): FinanceEntryRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM finance_entries ORDER BY occurred_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapFinanceEntryRow)
  }

  public get(id: string): FinanceEntryRecord | null {
    const row = this.database
      .prepare('SELECT * FROM finance_entries WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapFinanceEntryRow(row) : null
  }

  public create(input: NewFinanceEntryRecord): FinanceEntryRecord {
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO finance_entries (
            id, trip_id, truck_id, garage_id, occurred_at,
            category, amount_cents, description, source
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.tripId,
        input.truckId,
        input.garageId,
        input.occurredAt,
        input.category,
        input.amountCents,
        input.description,
        input.source,
      )

    return this.get(id)!
  }

  public update(
    id: string,
    input: NewFinanceEntryRecord,
  ): FinanceEntryRecord | null {
    const result = this.database
      .prepare(
        `
          UPDATE finance_entries
          SET trip_id = ?, truck_id = ?, garage_id = ?, occurred_at = ?,
              category = ?, amount_cents = ?, description = ?, source = ?
          WHERE id = ?
        `,
      )
      .run(
        input.tripId,
        input.truckId,
        input.garageId,
        input.occurredAt,
        input.category,
        input.amountCents,
        input.description,
        input.source,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM finance_entries WHERE id = ?').run(id)
  }
}
