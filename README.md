# FleetOps Desktop

FleetOps Desktop is a local-first operational companion for American Truck Simulator. It listens to telemetry, turns driving sessions into grounded operational records, and stays honest about what telemetry can and cannot prove.

This repository currently contains the foundation scaffold:

- Electron desktop shell
- React + TypeScript renderer powered by Vite
- Tailwind-based placeholder UI with an industrial visual direction
- Architecture and scope documents for the MVP
- Extension seams for telemetry, trips, trucks, garages, maintenance, finance, reports, settings, and exports

## Identity

FleetOps is:

- a lightweight operational terminal
- single-player-first
- local-first
- telemetry-assisted
- designed around SQLite persistence

FleetOps is not:

- a tycoon overhaul
- a cloud VTC platform
- a save editor
- an ATS memory manipulation tool
- an in-game overlay for the MVP

## MVP boundaries

The MVP may auto-detect the currently driven truck when telemetry provides enough signal.

The MVP may not claim to automatically import:

- the entire ATS company
- all garages
- AI drivers
- inactive trucks

Those areas require either manual entry or a future save-parser module that is explicitly designed and approved.

## Tech stack

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- SQLite planned for the next implementation phase

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start the desktop shell in development:

```bash
npm run dev
```

3. Build the renderer and Electron entrypoints:

```bash
npm run build
```

4. Run linting:

```bash
npm run lint
```

## Repository layout

```text
docs/
  architecture.md
  phases.md
  scope.md
  telemetry-boundaries.md
electron/
  main.ts
  preload.ts
src/
  features/
    dashboard/
    finance/
    garages/
    maintenance/
    reports/
    settings/
    trips/
    trucks/
  lib/
    domain/
    persistence/
    telemetry/
  platform/
```

## Architectural direction

- Keep telemetry ingestion, domain policies, persistence, and UI concerns separate.
- Treat telemetry as a helpful signal, not as perfect truth.
- Prefer manual correction workflows over false certainty.
- Keep the MVP grounded, inspectable, and maintainable.
- Add future modules through explicit contracts, not ad hoc cross-coupling.

## Documentation

- `docs/architecture.md` explains the intended system seams.
- `docs/scope.md` defines MVP scope and non-goals.
- `docs/telemetry-boundaries.md` documents what telemetry can reliably support.
- `docs/phases.md` provides the development roadmap.
