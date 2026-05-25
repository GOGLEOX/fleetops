import type Database from 'better-sqlite3'
import type { SettingsRecord } from '../../../src/lib/persistence/contracts'
import { isoNow } from '../repository-helpers'

export class SettingsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): SettingsRecord[] {
    const rows = this.database
      .prepare(
        'SELECT key, value, updated_at FROM settings ORDER BY key ASC',
      )
      .all() as Array<{ key: string; value: string; updated_at: string }>

    return rows.map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updated_at,
    }))
  }

  public get(key: string): SettingsRecord | null {
    const row = this.database
      .prepare('SELECT key, value, updated_at FROM settings WHERE key = ?')
      .get(key) as { key: string; value: string; updated_at: string } | undefined

    if (!row) {
      return null
    }

    return {
      key: row.key,
      value: row.value,
      updatedAt: row.updated_at,
    }
  }

  public upsert(key: string, value: string): SettingsRecord {
    const updatedAt = isoNow()

    this.database
      .prepare(
        `
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        `,
      )
      .run(key, value, updatedAt)

    return { key, value, updatedAt }
  }

  public delete(key: string): void {
    this.database.prepare('DELETE FROM settings WHERE key = ?').run(key)
  }
}
