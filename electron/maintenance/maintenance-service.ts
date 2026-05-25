import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FinanceEntryRecord,
  MaintenanceEventRecord,
  MaintenanceRuleRecord,
} from '../../src/lib/persistence/contracts'
import type {
  MaintenanceEventInput,
  MaintenanceRuleInput,
  MaintenanceSnapshot,
  TruckMaintenanceDetail,
} from '../../src/lib/maintenance/contracts'
import {
  evaluateTruckMaintenanceStatuses,
} from '../../src/lib/maintenance/evaluation'

export class MaintenanceService {
  private readonly repositories: FleetOpsRepositories

  public constructor(repositories: FleetOpsRepositories) {
    this.repositories = repositories
  }

  public getSnapshot(): MaintenanceSnapshot {
    const rules = this.repositories.maintenanceRules.list()
    const trucks = this.repositories.trucks
      .list()
      .filter((truck) => truck.status !== 'ignored' && truck.status !== 'pending')

    const statuses = trucks.flatMap((truck) =>
      evaluateTruckMaintenanceStatuses(
        truck,
        rules,
        this.repositories.maintenanceEvents.listByTruckId(truck.id),
      ),
    )

    const recentHistory = this.repositories.maintenanceEvents
      .list()
      .slice(0, 20)
      .map((event) => ({
        event,
        truck: this.repositories.trucks.get(event.truckId),
        rule: event.ruleId ? this.repositories.maintenanceRules.get(event.ruleId) : null,
        financeEntry: this.findFinanceEntryForMaintenanceEvent(event),
      }))

    return {
      rules,
      dueNow: statuses.filter((status) => status.status === 'due_now'),
      dueSoon: statuses.filter((status) => status.status === 'due_soon'),
      current: statuses.filter((status) => status.status === 'current'),
      recentHistory,
      trucks,
    }
  }

  public getTruckDetail(truckId: string): TruckMaintenanceDetail | null {
    const truck = this.repositories.trucks.get(truckId)
    if (!truck) {
      return null
    }

    const rules = this.repositories.maintenanceRules.list()
    const history = this.repositories.maintenanceEvents
      .listByTruckId(truckId)
      .map((event) => ({
        event,
        rule: event.ruleId ? this.repositories.maintenanceRules.get(event.ruleId) : null,
        financeEntry: this.findFinanceEntryForMaintenanceEvent(event),
      }))

    return {
      truck,
      statuses: evaluateTruckMaintenanceStatuses(
        truck,
        rules,
        history.map((entry) => entry.event),
      ),
      history,
    }
  }

  public saveRule(input: MaintenanceRuleInput): MaintenanceRuleRecord | null {
    const name = input.name.trim()
    if (!name || input.intervalMiles <= 0) {
      return null
    }

    if (input.ruleId) {
      const existing = this.repositories.maintenanceRules.get(input.ruleId)
      if (!existing) {
        return null
      }

      return this.repositories.maintenanceRules.update(input.ruleId, {
        name,
        intervalMiles: input.intervalMiles,
        intervalEngineHours: input.intervalEngineHours,
        enabled: input.enabled,
      })
    }

    return this.repositories.maintenanceRules.create({
      name,
      intervalMiles: input.intervalMiles,
      intervalEngineHours: input.intervalEngineHours,
      enabled: input.enabled,
    })
  }

  public logMaintenanceEvent(input: MaintenanceEventInput): TruckMaintenanceDetail | null {
    const truck = this.repositories.trucks.get(input.truckId)
    if (!truck) {
      return null
    }

    const event = this.repositories.maintenanceEvents.create({
      truckId: input.truckId,
      ruleId: input.ruleId,
      performedAt: input.performedAt,
      odometerMi: input.odometerMi,
      engineHours: input.engineHours,
      costCents: input.costCents,
      notes: input.notes?.trim() || null,
      source: 'manual',
    })

    if (input.costCents != null && input.costCents !== 0) {
      const rule = input.ruleId
        ? this.repositories.maintenanceRules.get(input.ruleId)
        : null
      this.repositories.financeEntries.create({
        tripId: null,
        truckId: input.truckId,
        garageId: this.repositories.truckGarageAssignments.getByTruckId(input.truckId)?.garageId ?? null,
        occurredAt: input.performedAt,
        category: 'maintenance',
        amountCents: -Math.abs(input.costCents),
        description: rule
          ? `${rule.name} service`
          : 'Manual maintenance service',
        source: 'manual',
      })
    }

    if ((truck.currentOdometerMi ?? 0) < input.odometerMi) {
      this.repositories.trucks.update(truck.id, {
        id: truck.id,
        displayName: truck.displayName,
        detectedMake: truck.detectedMake,
        detectedModel: truck.detectedModel,
        detectedConfigHash: truck.detectedConfigHash,
        vinHash: truck.vinHash,
        firstSeenAt: truck.firstSeenAt,
        lastSeenAt: truck.lastSeenAt,
        startingOdometerMi: truck.startingOdometerMi,
        currentOdometerMi: input.odometerMi,
        engineHours: input.engineHours ?? truck.engineHours,
        idleHours: truck.idleHours,
        fuelUsedGal: truck.fuelUsedGal,
        status: truck.status,
        notes: truck.notes,
      })
    }

    return this.getTruckDetail(event.truckId)
  }

  private findFinanceEntryForMaintenanceEvent(
    event: MaintenanceEventRecord,
  ): FinanceEntryRecord | null {
    return (
      this.repositories.financeEntries
        .listByTruckId(event.truckId)
        .find(
          (entry) =>
            entry.category === 'maintenance' &&
            entry.occurredAt === event.performedAt &&
            Math.abs(entry.amountCents) === Math.abs(event.costCents ?? 0),
        ) ?? null
    )
  }
}
