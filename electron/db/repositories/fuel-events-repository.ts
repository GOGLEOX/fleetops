import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  FuelEventRecord,
  NewFuelEventRecord,
} from '../../../src/lib/persistence/contracts'

function mapFuelEventRow(row: Record<string, unknown>): FuelEventRecord {
  return {
    id: String(row.id),
    tripId: (row.trip_id as string | null) ?? null,
    truckId: (row.truck_id as string | null) ?? null,
    occurredAt: String(row.occurred_at),
    gallons: Number(row.gallons),
    estimatedCostCents: (row.estimated_cost_cents as number | null) ?? null,
    locationLabel: (row.location_label as string | null) ?? null,
    source: row.source as FuelEventRecord['source'],
    notes: (row.notes as string | null) ?? null,
  }
}

export class FuelEventsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): FuelEventRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM fuel_events ORDER BY occurred_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapFuelEventRow)
  }

  public get(id: string): FuelEventRecord | null {
    const row = this.database
      .prepare('SELECT * FROM fuel_events WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapFuelEventRow(row) : null
  }

  public listByTruckId(truckId: string): FuelEventRecord[] {
    const rows = this.database
      .prepare(
        'SELECT * FROM fuel_events WHERE truck_id = ? ORDER BY occurred_at DESC',
      )
      .all(truckId) as Record<string, unknown>[]

    return rows.map(mapFuelEventRow)
  }

  public create(input: NewFuelEventRecord): FuelEventRecord {
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO fuel_events (
            id, trip_id, truck_id, occurred_at, gallons, estimated_cost_cents,
            location_label, source, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.tripId,
        input.truckId,
        input.occurredAt,
        input.gallons,
        input.estimatedCostCents,
        input.locationLabel,
        input.source,
        input.notes,
      )

    return this.get(id)!
  }

  public update(id: string, input: NewFuelEventRecord): FuelEventRecord | null {
    const result = this.database
      .prepare(
        `
          UPDATE fuel_events
          SET trip_id = ?, truck_id = ?, occurred_at = ?, gallons = ?,
              estimated_cost_cents = ?, location_label = ?, source = ?, notes = ?
          WHERE id = ?
        `,
      )
      .run(
        input.tripId,
        input.truckId,
        input.occurredAt,
        input.gallons,
        input.estimatedCostCents,
        input.locationLabel,
        input.source,
        input.notes,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM fuel_events WHERE id = ?').run(id)
  }
}
