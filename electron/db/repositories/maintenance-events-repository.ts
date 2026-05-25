import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  MaintenanceEventRecord,
  NewMaintenanceEventRecord,
} from '../../../src/lib/persistence/contracts'

function mapMaintenanceEventRow(
  row: Record<string, unknown>,
): MaintenanceEventRecord {
  return {
    id: String(row.id),
    truckId: String(row.truck_id),
    ruleId: (row.rule_id as string | null) ?? null,
    performedAt: String(row.performed_at),
    odometerMi: Number(row.odometer_mi),
    engineHours: (row.engine_hours as number | null) ?? null,
    costCents: (row.cost_cents as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    source: row.source as MaintenanceEventRecord['source'],
  }
}

export class MaintenanceEventsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): MaintenanceEventRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM maintenance_events ORDER BY performed_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapMaintenanceEventRow)
  }

  public get(id: string): MaintenanceEventRecord | null {
    const row = this.database
      .prepare('SELECT * FROM maintenance_events WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapMaintenanceEventRow(row) : null
  }

  public listByTruckId(truckId: string): MaintenanceEventRecord[] {
    const rows = this.database
      .prepare(
        'SELECT * FROM maintenance_events WHERE truck_id = ? ORDER BY performed_at DESC',
      )
      .all(truckId) as Record<string, unknown>[]

    return rows.map(mapMaintenanceEventRow)
  }

  public create(input: NewMaintenanceEventRecord): MaintenanceEventRecord {
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO maintenance_events (
            id, truck_id, rule_id, performed_at, odometer_mi, engine_hours,
            cost_cents, notes, source
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.truckId,
        input.ruleId,
        input.performedAt,
        input.odometerMi,
        input.engineHours,
        input.costCents,
        input.notes,
        input.source,
      )

    return this.get(id)!
  }

  public update(
    id: string,
    input: NewMaintenanceEventRecord,
  ): MaintenanceEventRecord | null {
    const result = this.database
      .prepare(
        `
          UPDATE maintenance_events
          SET truck_id = ?, rule_id = ?, performed_at = ?, odometer_mi = ?,
              engine_hours = ?, cost_cents = ?, notes = ?, source = ?
          WHERE id = ?
        `,
      )
      .run(
        input.truckId,
        input.ruleId,
        input.performedAt,
        input.odometerMi,
        input.engineHours,
        input.costCents,
        input.notes,
        input.source,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM maintenance_events WHERE id = ?').run(id)
  }
}
