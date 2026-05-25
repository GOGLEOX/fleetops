import type Database from 'better-sqlite3'

export interface RepositoryContext {
  database: Database.Database
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function toSqliteBoolean(value: boolean): number {
  return value ? 1 : 0
}

export function fromSqliteBoolean(value: number): boolean {
  return value === 1
}
