# FleetOps Desktop Scope

## Product intent

FleetOps Desktop is a believable operations companion for a solo ATS player. It should help the player review sessions, keep practical records, and maintain a small operational ledger without becoming a management sim or pretending to synchronize the whole save automatically.

## MVP includes

- local desktop shell
- telemetry connection status
- placeholder dashboard shell
- project structure for future feature modules
- documentation for architecture, phases, and telemetry constraints
- planned support for:
  - trip records
  - truck registry
  - garage records
  - maintenance history
  - finance ledger
  - reports
  - exports
  - settings

## MVP does not include

- cloud accounts
- multiplayer or VTC collaboration features
- automatic full-company import
- automatic garage discovery from telemetry alone
- AI driver management
- save editing
- direct ATS memory manipulation
- in-game overlay
- full simulation or tycoon systems

## Single-player-first implications

- one active driving session is the primary live data source
- inactive assets remain manual until another import strategy exists
- the app should value clarity and correction over automation theater

## What "telemetry-assisted" means

- FleetOps should use telemetry to observe the current session
- FleetOps should register useful facts when confidence is reasonable
- FleetOps should ask for manual correction when confidence is not reasonable

## Non-goals for the foundation phase

- implementing the full database schema
- building final reports and charts
- automated company reconciliation
- advanced maintenance forecasting
- accounting-grade financial modeling
