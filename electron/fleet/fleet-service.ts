import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FleetSnapshot,
  FleetTruckDetail,
  FleetTruckSummary,
  RegisterDetectedTruckInput,
  UpdateTruckInput,
} from '../../src/lib/fleet/contracts'
import type {
  TruckRecord,
} from '../../src/lib/persistence/contracts'
import type { SessionTrackingService } from '../session/session-tracking-service'
import {
  evaluateTruckMaintenanceStatuses,
  hasMaintenanceAttention,
  summarizeMaintenanceLabel,
} from '../../src/lib/maintenance/evaluation'

export class FleetService {
  private readonly repositories: FleetOpsRepositories
  private readonly sessionTrackingService: SessionTrackingService

  public constructor(
    repositories: FleetOpsRepositories,
    sessionTrackingService: SessionTrackingService,
  ) {
    this.repositories = repositories
    this.sessionTrackingService = sessionTrackingService
  }

  public getSnapshot(): FleetSnapshot {
    const trucks = this.repositories.trucks
      .list()
      .filter((truck) => truck.status !== 'ignored')
      .map((truck) => this.buildTruckSummary(truck))

    const pendingTruck =
      trucks.find((summary) => summary.truck.status === 'pending')?.truck ?? null

    return {
      trucks,
      pendingTruck,
    }
  }

  public getTruckDetail(truckId: string): FleetTruckDetail | null {
    const truck = this.repositories.trucks.get(truckId)
    if (!truck || truck.status === 'ignored') {
      return null
    }

    const trips = this.repositories.trips.listByTruckId(truckId)
    const fuelEvents = this.repositories.fuelEvents.listByTruckId(truckId)
    const maintenanceEvents =
      this.repositories.maintenanceEvents.listByTruckId(truckId)
    const financeEntries = this.repositories.financeEntries.listByTruckId(truckId)
    const summary = this.buildTruckSummary(truck)

    return {
      truck,
      trips,
      fuelEvents,
      maintenanceEvents,
      financeEntries,
      summary: {
        totalTrips: trips.length,
        totalDistanceMi: trips.reduce((sum, trip) => sum + trip.distanceMi, 0),
        totalFuelGallons: fuelEvents.reduce((sum, event) => sum + event.gallons, 0),
        avgMpg: summary.avgMpg,
        idleHours: truck.idleHours ?? 0,
        lastSeenLabel: summary.lastSeenLabel,
        netProfitCents: summary.netProfitCents,
        maintenanceDue: summary.maintenanceDue,
        maintenanceDueLabel: summary.maintenanceDueLabel,
        maintenanceStatuses: summary.maintenanceStatuses,
      },
    }
  }

  public async registerDetectedTruck(
    input: RegisterDetectedTruckInput,
  ): Promise<FleetTruckDetail | null> {
    await this.sessionTrackingService.registerPendingTruckWithDetails(input)
    return this.getTruckDetail(input.truckId)
  }

  public async updateTruck(input: UpdateTruckInput): Promise<FleetTruckDetail | null> {
    await this.sessionTrackingService.updateTruckDetails(input)
    return this.getTruckDetail(input.truckId)
  }

  private buildTruckSummary(truck: TruckRecord): FleetTruckSummary {
    const trips = this.repositories.trips.listByTruckId(truck.id)
    const financeEntries = this.repositories.financeEntries.listByTruckId(truck.id)
    const maintenanceEvents =
      this.repositories.maintenanceEvents.listByTruckId(truck.id)
    const maintenanceRules = this.repositories.maintenanceRules.list()

    const totalTripDistance = trips.reduce((sum, trip) => sum + trip.distanceMi, 0)
    const totalTripFuel = trips.reduce((sum, trip) => sum + trip.fuelUsedGal, 0)
    const avgMpg =
      totalTripDistance > 0 && totalTripFuel > 0
        ? totalTripDistance / totalTripFuel
        : null

    const netProfitCents = financeEntries.reduce(
      (sum, entry) => sum + entry.amountCents,
      0,
    )

    const maintenanceStatuses = evaluateTruckMaintenanceStatuses(
      truck,
      maintenanceRules,
      maintenanceEvents,
    )
    const maintenanceDueLabel = summarizeMaintenanceLabel(maintenanceStatuses)

    return {
      truck,
      avgMpg,
      lastSeenLabel: formatRelativeDate(truck.lastSeenAt),
      maintenanceDue: hasMaintenanceAttention(maintenanceStatuses),
      maintenanceDueLabel,
      maintenanceStatuses,
      netProfitCents,
    }
  }
}

function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString()
}
