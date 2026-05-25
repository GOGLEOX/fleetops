import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FinanceEntryRecord,
  GarageRecord,
  MaintenanceEventRecord,
  TripRecord,
  TruckRecord,
} from '../../src/lib/persistence/contracts'
import type {
  AssignTripToGarageInput,
  AssignTruckToGarageInput,
  GarageAnalytics,
  GarageDetail,
  GarageListItem,
  GarageSnapshot,
  GarageSuggestion,
  GarageUpsertInput,
} from '../../src/lib/garages/contracts'
import { isoNow } from '../db/repository-helpers'

export class GarageService {
  private readonly repositories: FleetOpsRepositories

  public constructor(repositories: FleetOpsRepositories) {
    this.repositories = repositories
  }

  public getSnapshot(): GarageSnapshot {
    return {
      garages: this.repositories.garages
        .list()
        .map((garage) => this.buildGarageListItem(garage)),
    }
  }

  public getGarageDetail(garageId: string): GarageDetail | null {
    const garage = this.repositories.garages.get(garageId)
    if (!garage) {
      return null
    }

    return this.buildGarageDetail(garage)
  }

  public saveGarage(input: GarageUpsertInput): GarageDetail | null {
    const trimmedName = input.name.trim()
    const trimmedCity = input.city.trim()
    const trimmedState = input.state.trim()

    if (!trimmedName || !trimmedCity || !trimmedState) {
      return null
    }

    const garage = input.garageId
      ? this.repositories.garages.update(input.garageId, {
          name: trimmedName,
          city: trimmedCity,
          state: trimmedState,
          divisionName: input.divisionName?.trim() || null,
          manuallyCreated: true,
          notes: input.notes?.trim() || null,
        })
      : this.repositories.garages.create({
          name: trimmedName,
          city: trimmedCity,
          state: trimmedState,
          divisionName: input.divisionName?.trim() || null,
          manuallyCreated: true,
          notes: input.notes?.trim() || null,
        })

    return garage ? this.buildGarageDetail(garage) : null
  }

  public assignTruck(input: AssignTruckToGarageInput): GarageDetail | null {
    const truck = this.repositories.trucks.get(input.truckId)
    const garage = this.repositories.garages.get(input.garageId)
    if (!truck || !garage) {
      return null
    }

    this.repositories.truckGarageAssignments.upsert({
      truckId: input.truckId,
      garageId: input.garageId,
      assignedAt: isoNow(),
      notes: input.notes?.trim() || null,
    })

    return this.buildGarageDetail(garage)
  }

  public assignTrip(input: AssignTripToGarageInput): GarageDetail | null {
    const trip = this.repositories.trips.get(input.tripId)
    if (!trip) {
      return null
    }

    const nextGarageId = input.garageId
    if (nextGarageId && !this.repositories.garages.get(nextGarageId)) {
      return null
    }

    this.repositories.trips.update(input.tripId, {
      truckId: trip.truckId,
      garageId: nextGarageId,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      originCity: trip.originCity,
      destinationCity: trip.destinationCity,
      cargoName: trip.cargoName,
      revenueCents: trip.revenueCents,
      distanceMi: trip.distanceMi,
      fuelUsedGal: trip.fuelUsedGal,
      avgMpg: trip.avgMpg,
      idleMinutes: trip.idleMinutes,
      damageStart: trip.damageStart,
      damageEnd: trip.damageEnd,
      status: trip.status,
      notes: trip.notes,
    })

    return nextGarageId ? this.getGarageDetail(nextGarageId) : null
  }

  private buildGarageListItem(garage: GarageRecord): GarageListItem {
    const detail = this.buildGarageDetail(garage)
    return {
      garage,
      assignedTruckCount: detail.analytics.assignedTruckCount,
      linkedTripCount: detail.linkedTrips.length,
      revenueCents: detail.analytics.revenueCents,
      lastActivityLabel: detail.analytics.lastActivityLabel,
    }
  }

  private buildGarageDetail(garage: GarageRecord): GarageDetail {
    const assignments = this.repositories.truckGarageAssignments.listByGarageId(garage.id)
    const assignedTrucks = assignments
      .map((assignment) => this.repositories.trucks.get(assignment.truckId))
      .filter((truck): truck is TruckRecord => truck != null)

    const linkedTrips = this.repositories.trips.listByGarageId(garage.id)
    const allTrips = this.repositories.trips.list()
    const departingTrips = allTrips.filter((trip) =>
      cityMatches(trip.originCity, garage.city),
    )
    const arrivingTrips = allTrips.filter((trip) =>
      cityMatches(trip.destinationCity, garage.city),
    )

    const financeEntries = collectGarageFinanceEntries(
      garage.id,
      linkedTrips,
      assignedTrucks,
      this.repositories.financeEntries.list(),
    )

    const maintenanceEvents = assignedTrucks.flatMap((truck) =>
      this.repositories.maintenanceEvents.listByTruckId(truck.id),
    )

    const analytics = buildGarageAnalytics({
      garage,
      linkedTrips,
      departingTrips,
      arrivingTrips,
      assignments,
      financeEntries,
      maintenanceEvents,
    })

    return {
      garage,
      analytics,
      assignedTrucks,
      truckAssignments: assignments,
      linkedTrips,
      departingTrips,
      arrivingTrips,
      financeEntries,
      maintenanceEvents,
      tripSuggestions: buildTripSuggestions(garage, allTrips),
      availableTrucks: this.repositories.trucks
        .list()
        .filter((truck) => truck.status !== 'ignored'),
      availableTrips: allTrips,
    }
  }
}

function buildTripSuggestions(
  garage: GarageRecord,
  trips: TripRecord[],
): GarageSuggestion[] {
  return trips
    .filter((trip) => trip.garageId == null)
    .flatMap((trip) => {
      const suggestions: GarageSuggestion[] = []

      if (cityMatches(trip.originCity, garage.city)) {
        suggestions.push({
          tripId: trip.id,
          city: trip.originCity ?? garage.city,
          matchType: 'origin',
          reason: 'Origin city matches this garage.',
        })
      }

      if (cityMatches(trip.destinationCity, garage.city)) {
        suggestions.push({
          tripId: trip.id,
          city: trip.destinationCity ?? garage.city,
          matchType: 'destination',
          reason: 'Destination city matches this garage.',
        })
      }

      return suggestions
    })
    .slice(0, 8)
}

function buildGarageAnalytics(input: {
  garage: GarageRecord
  linkedTrips: TripRecord[]
  departingTrips: TripRecord[]
  arrivingTrips: TripRecord[]
  assignments: Array<{ assignedAt: string }>
  financeEntries: FinanceEntryRecord[]
  maintenanceEvents: MaintenanceEventRecord[]
}): GarageAnalytics {
  const revenueFromTrips = input.linkedTrips.reduce(
    (sum, trip) => sum + (trip.revenueCents ?? 0),
    0,
  )
  const revenueFromFinance = input.financeEntries
    .filter((entry) => entry.category === 'revenue')
    .reduce((sum, entry) => sum + Math.max(entry.amountCents, 0), 0)
  const revenueCents = Math.max(revenueFromTrips, revenueFromFinance)

  const fuelSpendCents = Math.abs(
    input.financeEntries
      .filter((entry) => entry.category === 'fuel')
      .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
  )
  const maintenanceCostCents = Math.abs(
    input.maintenanceEvents.reduce(
      (sum, event) => sum + Math.min(event.costCents ?? 0, 0),
      0,
    ) ||
      input.financeEntries
        .filter((entry) => entry.category === 'maintenance')
        .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
  )
  const directCostCents = fuelSpendCents + maintenanceCostCents
  const averageOperatingMarginPercent =
    revenueCents > 0 ? ((revenueCents - directCostCents) / revenueCents) * 100 : null

  const commonCargo = findMostCommonCargo([
    ...input.linkedTrips,
    ...input.departingTrips,
    ...input.arrivingTrips,
  ])

  const lastActivity = [
    input.garage.updatedAt,
    ...input.linkedTrips.map((trip) => trip.updatedAt),
    ...input.financeEntries.map((entry) => entry.occurredAt),
    ...input.maintenanceEvents.map((event) => event.performedAt),
    ...input.assignments.map((assignment) => assignment.assignedAt),
  ]
    .filter(Boolean)
    .sort()
    .at(-1)

  return {
    departingTripCount: input.departingTrips.length,
    arrivingTripCount: input.arrivingTrips.length,
    assignedTruckCount: input.assignments.length,
    revenueCents,
    fuelSpendCents,
    maintenanceCostCents,
    averageOperatingMarginPercent,
    mostCommonCargo: commonCargo,
    lastActivityLabel: formatRelativeDate(lastActivity ?? input.garage.updatedAt),
  }
}

function collectGarageFinanceEntries(
  garageId: string,
  linkedTrips: TripRecord[],
  assignedTrucks: TruckRecord[],
  financeEntries: FinanceEntryRecord[],
): FinanceEntryRecord[] {
  const tripIds = new Set(linkedTrips.map((trip) => trip.id))
  const truckIds = new Set(assignedTrucks.map((truck) => truck.id))

  return dedupeById(
    financeEntries.filter(
      (entry) =>
        entry.garageId === garageId ||
        (entry.tripId != null && tripIds.has(entry.tripId)) ||
        (entry.truckId != null && truckIds.has(entry.truckId)),
    ),
  )
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}

function cityMatches(value: string | null, city: string): boolean {
  return normalizeCity(value) === normalizeCity(city)
}

function normalizeCity(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function findMostCommonCargo(trips: TripRecord[]): string | null {
  const counts = new Map<string, number>()

  for (const trip of trips) {
    const cargoName = trip.cargoName?.trim()
    if (!cargoName) {
      continue
    }

    counts.set(cargoName, (counts.get(cargoName) ?? 0) + 1)
  }

  let leader: string | null = null
  let maxCount = 0

  for (const [cargoName, count] of counts) {
    if (count > maxCount) {
      leader = cargoName
      maxCount = count
    }
  }

  return leader
}

function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString()
}
