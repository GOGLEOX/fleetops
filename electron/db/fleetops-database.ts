import type Database from 'better-sqlite3'
import type { DatabaseHealth } from '../../src/lib/persistence/contracts'
import { migrations } from './migrations'
import { createRepositories, type FleetOpsRepositories } from './repositories'
import { maintenanceRuleSeeds } from './seeds'
import { isoNow, toSqliteBoolean } from './repository-helpers'
import { openSqliteDatabase } from './sqlite'

interface FleetOpsDatabaseOptions {
  databasePath: string
}

export class FleetOpsDatabase {
  public readonly repositories: FleetOpsRepositories
  private readonly database: Database.Database
  private initializedAt = ''
  private readonly databasePath: string

  public constructor(options: FleetOpsDatabaseOptions) {
    this.databasePath = options.databasePath
    this.database = openSqliteDatabase(this.databasePath)
    this.repositories = createRepositories(this.database)
  }

  public initialize(): void {
    this.runMigrations()
    this.seedMaintenanceRules()
    this.initializedAt = isoNow()
  }

  public close(): void {
    this.database.close()
  }

  public getHealth(): DatabaseHealth {
    const tableCount = Number(
      (
        this.database
          .prepare(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
          )
          .get() as { count: number }
      ).count,
    )
    const migrationCount = Number(
      (this.database.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as { count: number }).count,
    )
    const maintenanceRuleCount = Number(
      (
        this.database
          .prepare('SELECT COUNT(*) as count FROM maintenance_rules')
          .get() as { count: number }
      ).count,
    )

    return {
      ok: true,
      initializedAt: this.initializedAt,
      tableCount,
      migrationCount,
      maintenanceRuleCount,
      sampleCrudReady: tableCount >= 10 && maintenanceRuleCount > 0,
    }
  }

  private runMigrations(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `)

    const appliedMigrationIds = new Set(
      (
        this.database
          .prepare(
            'SELECT id FROM schema_migrations ORDER BY applied_at ASC',
          )
          .all() as Array<{ id: string }>
      ).map((row) => row.id),
    )

    for (const migration of migrations) {
      if (appliedMigrationIds.has(migration.id)) {
        continue
      }

      this.database.exec(migration.sql)
      this.database
        .prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)')
        .run(migration.id, isoNow())
    }
  }

  private seedMaintenanceRules(): void {
    const insertRule = this.database.prepare(
      `
        INSERT OR IGNORE INTO maintenance_rules (
          id, name, interval_miles, interval_engine_hours, enabled,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )

    const seedTimestamp = isoNow()
    const transaction = this.database.transaction(() => {
      for (const rule of maintenanceRuleSeeds) {
        insertRule.run(
          rule.id,
          rule.name,
          rule.intervalMiles,
          rule.intervalEngineHours,
          toSqliteBoolean(rule.enabled),
          seedTimestamp,
          seedTimestamp,
        )
      }
    })

    transaction()
  }
}

export function createFleetOpsDatabase(
  options: FleetOpsDatabaseOptions,
): FleetOpsDatabase {
  return new FleetOpsDatabase(options)
}
