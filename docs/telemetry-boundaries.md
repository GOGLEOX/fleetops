# Telemetry Boundaries

## Purpose

This document defines what FleetOps should treat as likely observable from ATS telemetry and what it must not claim without additional systems.

## Reliable enough for telemetry-assisted workflows

Depending on the bridge and game state, FleetOps can usually expect some combination of:

- current session activity
- current truck make or model identifiers
- speed and movement state
- fuel level
- odometer-like mileage values when exposed
- cargo or job details when active
- location or navigation-derived context
- damage or wear-related signals when exposed by the bridge

These signals are useful for:

- detecting an active session
- proposing trip start and trip end records
- suggesting which truck is currently in use
- estimating fuel use and distance for the active run

## Not reliable enough to claim automatically

Telemetry should not be treated as proof of:

- the complete owned truck roster
- inactive truck state
- all owned garages
- garage upgrades
- all hired drivers
- full company finances
- historical company state before FleetOps was installed

## Product rule

If telemetry cannot provide reliable truth, FleetOps must:

- ask for manual confirmation
- allow manual edits
- label inferred values clearly

## Active truck policy

Allowed:

- attempt to identify the currently driven truck from telemetry fields
- match that telemetry against the local truck registry
- create or prompt for a truck record when the app has enough evidence

Not allowed:

- claim the entire fleet has been discovered automatically
- fabricate inactive truck records
- imply company completeness from a single active session

## Future extension

A future save-parser module may widen what FleetOps can import. If that module is added later, the application should make the source of each record explicit:

- telemetry-derived
- manually entered
- parser-imported
