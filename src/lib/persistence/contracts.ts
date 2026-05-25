export interface DatabaseAdapter {
  readonly id: string
  open(): Promise<void>
  close(): Promise<void>
}

export interface MigrationRecord {
  version: string
  appliedAtIso: string
}
