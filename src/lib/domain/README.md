FleetOps domain logic will live here once persistence and session intake are wired.

The intended split is:
- aggregates for trucks, trips, garages, maintenance, and finance
- services that turn telemetry and manual input into durable records
- policy functions that stay independent from Electron and UI concerns
