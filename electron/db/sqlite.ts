import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

export function openSqliteDatabase(databasePath: string): Database.Database {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const database = new Database(databasePath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  database.pragma('synchronous = NORMAL')

  return database
}
