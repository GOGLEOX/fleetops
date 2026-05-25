# FleetOps Desktop Architecture

## Goals

FleetOps Desktop should behave like a grounded carrier operations terminal for a single ATS player. The architecture should stay light, local-first, and practical while leaving clear expansion points for later modules.

## High-level layers

### 1. Desktop shell

- Electron owns the native window lifecycle.
- The preload layer exposes only narrow desktop APIs to the renderer.
- Node access stays out of the renderer by default.

### 2. Renderer application

- React handles the application shell and operator-facing workflows.
- Tailwind provides utility styling without introducing a heavy component framework.
- The renderer should consume application services and view models, not raw telemetry bridges.

### 3. Application services

- Session intake services translate telemetry snapshots into candidate records.
- Reconciliation services decide when manual confirmation is required.
- Reporting services shape durable records into summaries and charts.

### 4. Domain layer

Planned domain areas:

- telemetry sessions
- trips
- trucks
- garages
- maintenance
- finance
- reports
- settings
- exports

The domain layer should remain framework-light and independent from Electron-specific code.

### 5. Persistence layer

- SQLite is the planned source of truth.
- A small adapter boundary should isolate the chosen SQLite library from the rest of the app.
- Schema changes must be migration-safe and easy to reason about.

## Suggested data flow

```text
Telemetry bridge -> normalized snapshot -> session intake -> reconciliation -> SQLite records -> renderer views
```

Important rule:

- Telemetry is an input signal.
- Durable records become application truth only after FleetOps has enough evidence or the user confirms them.

## Module seams

### Telemetry

Responsibilities:

- connect to an SCS telemetry bridge abstraction
- read snapshots
- normalize units and field names
- expose connection health

Should not:

- write business records directly
- decide fleet ownership
- assume complete company visibility

### Trips

Responsibilities:

- track driving sessions
- compose trip records
- capture route, distance, cargo, fuel, and elapsed time when available

Should not:

- infer company-wide state from one active session

### Trucks

Responsibilities:

- maintain the local registry of known trucks
- match telemetry against known active assets when possible
- allow manual correction when multiple trucks are plausible

Should not:

- claim every inactive truck is known automatically

### Garages

Responsibilities:

- store manually created or later parser-assisted garage records
- associate trucks, trips, and maintenance events with home locations

Should not:

- pretend telemetry alone can enumerate the full garage network

### Maintenance and finance

Responsibilities:

- store service events and operating costs
- keep entries auditable and editable

Should not:

- hide assumptions behind derived numbers with no operator traceability

## IPC principles

- Keep preload APIs narrow and explicit.
- Pass plain objects only.
- Avoid leaking filesystem or process primitives into UI code.

## Why this structure

This layout keeps the MVP lean while supporting later additions like:

- SQLite implementation details
- parser-based imports
- CSV or JSON exports
- richer reports and charts
- additional telemetry providers
