import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import type {
  NewReportRecord,
  ReportRecord,
} from '../../../src/lib/persistence/contracts'

function mapReportRow(row: Record<string, unknown>): ReportRecord {
  return {
    id: String(row.id),
    type: String(row.type),
    title: String(row.title),
    generatedAt: String(row.generated_at),
    payloadJson: String(row.payload_json),
  }
}

export class ReportsRepository {
  private readonly database: Database.Database

  public constructor(database: Database.Database) {
    this.database = database
  }

  public list(): ReportRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM reports ORDER BY generated_at DESC')
      .all() as Record<string, unknown>[]

    return rows.map(mapReportRow)
  }

  public get(id: string): ReportRecord | null {
    const row = this.database
      .prepare('SELECT * FROM reports WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined

    return row ? mapReportRow(row) : null
  }

  public create(input: NewReportRecord): ReportRecord {
    const id = input.id || randomUUID()

    this.database
      .prepare(
        `
          INSERT INTO reports (id, type, title, generated_at, payload_json)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(id, input.type, input.title, input.generatedAt, input.payloadJson)

    return this.get(id)!
  }

  public update(id: string, input: NewReportRecord): ReportRecord | null {
    const result = this.database
      .prepare(
        `
          UPDATE reports
          SET type = ?, title = ?, generated_at = ?, payload_json = ?
          WHERE id = ?
        `,
      )
      .run(input.type, input.title, input.generatedAt, input.payloadJson, id)

    return result.changes > 0 ? this.get(id) : null
  }

  public delete(id: string): void {
    this.database.prepare('DELETE FROM reports WHERE id = ?').run(id)
  }
}
