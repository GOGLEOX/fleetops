# FleetOps Development Phases

## Phase 0: Foundation

Status: current

Goals:

- establish the repository
- stand up a runnable Electron placeholder app
- define scope, architecture, and telemetry boundaries
- create extension seams for major feature areas

Exit criteria:

- `npm install` succeeds
- `npm run dev` opens the placeholder shell
- `npm run build` succeeds
- core docs are present and aligned with product boundaries

## Phase 1: Local data spine

Goals:

- add SQLite integration
- define the first durable schema for trucks, trips, and session records
- add migration handling
- create repository-level persistence adapters

Exit criteria:

- the app can create and open a local database
- migrations are versioned and repeatable
- session and truck records can be stored locally

## Phase 2: Telemetry intake

Goals:

- add a telemetry bridge abstraction
- normalize active-session fields
- store candidate session snapshots
- expose connection health in the UI

Exit criteria:

- FleetOps can connect to a telemetry provider abstraction
- the UI shows live connection state
- normalized snapshots can feed downstream services

## Phase 3: Trip and truck workflows

Goals:

- create trip session intake
- attempt active truck matching
- add manual correction flows
- store reconciled trip records

Exit criteria:

- a live session can become a saved trip record
- the active truck can be matched or confirmed manually
- unresolved ambiguity is visible to the user

## Phase 4: Operations records

Goals:

- add garage records
- add maintenance events
- add finance ledger basics

Exit criteria:

- the player can maintain core operational records locally
- entries are editable and traceable

## Phase 5: Reports and exports

Goals:

- add operational summaries
- add charts and historical views
- export data to common local formats

Exit criteria:

- the app can summarize meaningful operational history
- exports produce portable local files
