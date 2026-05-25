export interface MigrationDefinition {
  id: string
  sql: string
}

export const migrations: MigrationDefinition[] = [
  {
    id: '001_initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trucks (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        detected_make TEXT,
        detected_model TEXT,
        detected_config_hash TEXT,
        vin_hash TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        starting_odometer_mi REAL,
        current_odometer_mi REAL,
        engine_hours REAL,
        idle_hours REAL,
        fuel_used_gal REAL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS garages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        division_name TEXT,
        manually_created INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        truck_id TEXT NOT NULL,
        garage_id TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        origin_city TEXT,
        destination_city TEXT,
        cargo_name TEXT,
        revenue_cents INTEGER,
        distance_mi REAL NOT NULL,
        fuel_used_gal REAL NOT NULL,
        avg_mpg REAL,
        idle_minutes INTEGER NOT NULL,
        damage_start REAL,
        damage_end REAL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS fuel_events (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        truck_id TEXT,
        occurred_at TEXT NOT NULL,
        gallons REAL NOT NULL,
        estimated_cost_cents INTEGER,
        location_label TEXT,
        source TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS maintenance_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        interval_miles REAL NOT NULL,
        interval_engine_hours REAL,
        enabled INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS maintenance_events (
        id TEXT PRIMARY KEY,
        truck_id TEXT NOT NULL,
        rule_id TEXT,
        performed_at TEXT NOT NULL,
        odometer_mi REAL NOT NULL,
        engine_hours REAL,
        cost_cents INTEGER,
        notes TEXT,
        source TEXT NOT NULL,
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
        FOREIGN KEY (rule_id) REFERENCES maintenance_rules(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS finance_entries (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        truck_id TEXT,
        garage_id TEXT,
        occurred_at TEXT NOT NULL,
        category TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        description TEXT NOT NULL,
        source TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL,
        FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
      CREATE INDEX IF NOT EXISTS idx_trips_truck_id ON trips(truck_id);
      CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
      CREATE INDEX IF NOT EXISTS idx_fuel_events_trip_id ON fuel_events(trip_id);
      CREATE INDEX IF NOT EXISTS idx_fuel_events_truck_id ON fuel_events(truck_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_events_truck_id ON maintenance_events(truck_id);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_trip_id ON finance_entries(trip_id);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_truck_id ON finance_entries(truck_id);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_garage_id ON finance_entries(garage_id);
    `,
  },
  {
    id: '002_session_records',
    sql: `
      CREATE TABLE IF NOT EXISTS session_records (
        id TEXT PRIMARY KEY,
        truck_id TEXT,
        trip_id TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        inferred INTEGER NOT NULL,
        distance_mi REAL NOT NULL,
        fuel_used_gal REAL NOT NULL,
        idle_minutes REAL NOT NULL,
        last_frame_at TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_session_records_status
        ON session_records(status);
      CREATE INDEX IF NOT EXISTS idx_session_records_truck_id
        ON session_records(truck_id);
      CREATE INDEX IF NOT EXISTS idx_session_records_trip_id
        ON session_records(trip_id);
    `,
  },
]
