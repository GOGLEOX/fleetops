import type {
  MaintenanceEventRecord,
  MaintenanceRuleRecord,
  TruckRecord,
} from '../persistence/contracts'
import type {
  MaintenanceDueStatus,
  TruckMaintenanceStatus,
} from './contracts'

const DUE_SOON_THRESHOLD = 0.8

export function evaluateTruckMaintenanceStatuses(
  truck: TruckRecord,
  rules: MaintenanceRuleRecord[],
  maintenanceEvents: MaintenanceEventRecord[],
): TruckMaintenanceStatus[] {
  return rules
    .filter((rule) => rule.enabled)
    .map((rule) => evaluateTruckMaintenanceStatus(truck, rule, maintenanceEvents))
    .sort((left, right) => compareStatus(left.status, right.status) || left.milesUntilDue - right.milesUntilDue)
}

export function summarizeMaintenanceLabel(
  statuses: TruckMaintenanceStatus[],
): string {
  if (statuses.length === 0) {
    return 'No active maintenance rules'
  }

  const dueNow = statuses.filter((status) => status.status === 'due_now')
  if (dueNow.length > 0) {
    return dueNow.map((status) => status.rule.name).join(', ')
  }

  const dueSoon = statuses.filter((status) => status.status === 'due_soon')
  if (dueSoon.length > 0) {
    return `${dueSoon.map((status) => status.rule.name).join(', ')} soon`
  }

  return 'Current'
}

export function hasMaintenanceAttention(statuses: TruckMaintenanceStatus[]): boolean {
  return statuses.some((status) => status.status !== 'current')
}

function evaluateTruckMaintenanceStatus(
  truck: TruckRecord,
  rule: MaintenanceRuleRecord,
  maintenanceEvents: MaintenanceEventRecord[],
): TruckMaintenanceStatus {
  const truckOdometerMi = truck.currentOdometerMi ?? truck.startingOdometerMi ?? 0
  const lastEvent =
    maintenanceEvents.find((event) => event.ruleId === rule.id) ?? null
  const baselineOdometerMi = lastEvent?.odometerMi ?? truck.startingOdometerMi ?? 0
  const milesSinceService = Math.max(truckOdometerMi - baselineOdometerMi, 0)
  const progressPercent =
    rule.intervalMiles > 0 ? (milesSinceService / rule.intervalMiles) * 100 : 0
  const milesUntilDue = rule.intervalMiles - milesSinceService
  const nextDueOdometerMi = baselineOdometerMi + rule.intervalMiles

  return {
    truck,
    rule,
    status: calculateDueStatus(progressPercent),
    progressPercent,
    milesSinceService,
    milesUntilDue,
    nextDueOdometerMi,
    baselineOdometerMi,
    lastEvent,
  }
}

function calculateDueStatus(progressPercent: number): MaintenanceDueStatus {
  if (progressPercent >= 100) {
    return 'due_now'
  }

  if (progressPercent >= DUE_SOON_THRESHOLD * 100) {
    return 'due_soon'
  }

  return 'current'
}

function compareStatus(
  left: MaintenanceDueStatus,
  right: MaintenanceDueStatus,
): number {
  return statusRank(left) - statusRank(right)
}

function statusRank(status: MaintenanceDueStatus): number {
  switch (status) {
    case 'due_now':
      return 0
    case 'due_soon':
      return 1
    case 'current':
      return 2
  }
}
