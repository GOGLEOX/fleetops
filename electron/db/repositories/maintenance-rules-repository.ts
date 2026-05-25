import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  MaintenanceRuleRecord,
  NewMaintenanceRuleRecord,
} from '../../../src/lib/persistence/contracts'
import { fromSqliteBoolean, isoNow, toSqliteBoolean } from '../repository-helpers'

function mapMaintenanceRuleRow(
  row: Record<string, unknown>,
): MaintenanceRuleRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    intervalMiles: Number(row.interval_miles),
    intervalEngineHours: (row.interval_engine_hours as number | null) ?? null,
    enabled: fromSqliteBoolean(Number(row.enabled)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export class MaintenanceRulesRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): MaintenanceRuleRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM maintenance_rules ORDER BY name ASC')
      .all() as Record<string, unknown>[]

    return rows.map(mapMaintenanceRuleRow)
  }

  public get(id: string): MaintenanceRuleRecord | null {
    const row = this.database
      .prepare('SELECT * FROM maintenance_rules WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapMaintenanceRuleRow(row) : null
  }

  public create(input: NewMaintenanceRuleRecord): MaintenanceRuleRecord {
    const createdAt = isoNow()
    const updatedAt = createdAt
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO maintenance_rules (
            id, name, interval_miles, interval_engine_hours, enabled,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.name,
        input.intervalMiles,
        input.intervalEngineHours,
        toSqliteBoolean(input.enabled),
        createdAt,
        updatedAt,
      )

    return this.get(id)!
  }

  public update(
    id: string,
    input: NewMaintenanceRuleRecord,
  ): MaintenanceRuleRecord | null {
    const updatedAt = isoNow()
    const result = this.database
      .prepare(
        `
          UPDATE maintenance_rules
          SET name = ?, interval_miles = ?, interval_engine_hours = ?,
              enabled = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.name,
        input.intervalMiles,
        input.intervalEngineHours,
        toSqliteBoolean(input.enabled),
        updatedAt,
        id,
      )

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM maintenance_rules WHERE id = ?').run(id)
  }
}
