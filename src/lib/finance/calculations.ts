import type {
  FinanceEntryRecord,
  TripRecord,
} from '../persistence/contracts'
import type {
  FinanceFilters,
  FinanceTotals,
  ProfitabilityRow,
} from './contracts'

export function filterFinanceEntries(
  entries: FinanceEntryRecord[],
  filters: FinanceFilters,
): FinanceEntryRecord[] {
  return entries.filter((entry) => {
    const occurredAt = new Date(entry.occurredAt).getTime()
    const matchesFrom =
      !filters.dateFrom || occurredAt >= new Date(filters.dateFrom).getTime()
    const matchesTo =
      !filters.dateTo || occurredAt <= new Date(filters.dateTo).getTime()
    const matchesTruck = !filters.truckId || entry.truckId === filters.truckId
    const matchesGarage = !filters.garageId || entry.garageId === filters.garageId
    const matchesCategory =
      filters.category === 'all' || entry.category === filters.category

    return (
      matchesFrom &&
      matchesTo &&
      matchesTruck &&
      matchesGarage &&
      matchesCategory
    )
  })
}

export function filterTripsForFinance(
  trips: TripRecord[],
  filters: FinanceFilters,
): TripRecord[] {
  return trips.filter((trip) => {
    const startedAt = new Date(trip.startedAt).getTime()
    const matchesFrom =
      !filters.dateFrom || startedAt >= new Date(filters.dateFrom).getTime()
    const matchesTo =
      !filters.dateTo || startedAt <= new Date(filters.dateTo).getTime()
    const matchesTruck = !filters.truckId || trip.truckId === filters.truckId
    const matchesGarage = !filters.garageId || trip.garageId === filters.garageId
    return matchesFrom && matchesTo && matchesTruck && matchesGarage
  })
}

export function calculateFinanceTotals(
  entries: FinanceEntryRecord[],
  trips: TripRecord[],
): FinanceTotals {
  const grossRevenueCents = entries
    .filter((entry) => entry.category === 'revenue')
    .reduce((sum, entry) => sum + Math.max(entry.amountCents, 0), 0)

  const totalExpensesCents = Math.abs(
    entries
      .filter((entry) => entry.category !== 'revenue')
      .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
  )

  const netProfitCents = grossRevenueCents - totalExpensesCents
  const totalMiles = trips.reduce((sum, trip) => sum + trip.distanceMi, 0)
  const fuelExpenses = Math.abs(
    entries
      .filter((entry) => entry.category === 'fuel')
      .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
  )
  const maintenanceReserve = Math.abs(
    entries
      .filter(
        (entry) =>
          entry.category === 'maintenance' || entry.category === 'repair',
      )
      .reduce((sum, entry) => sum + Math.min(entry.amountCents, 0), 0),
  )

  return {
    grossRevenueCents,
    totalExpensesCents,
    netProfitCents,
    revenuePerMile: totalMiles > 0 ? grossRevenueCents / totalMiles / 100 : null,
    costPerMile: totalMiles > 0 ? totalExpensesCents / totalMiles / 100 : null,
    fuelCostPerMile: totalMiles > 0 ? fuelExpenses / totalMiles / 100 : null,
    maintenanceReservePerMile:
      totalMiles > 0 ? maintenanceReserve / totalMiles / 100 : null,
    operatingMarginPercent:
      grossRevenueCents > 0 ? (netProfitCents / grossRevenueCents) * 100 : null,
    totalMiles,
  }
}

export function calculateProfitabilityRows(
  entries: FinanceEntryRecord[],
  trips: TripRecord[],
  dimension: 'truck' | 'garage',
): ProfitabilityRow[] {
  const tripMilesById = new Map(trips.map((trip) => [trip.id, trip.distanceMi]))
  const tripById = new Map(trips.map((trip) => [trip.id, trip]))
  const grouped = new Map<
    string,
    {
      label: string
      revenueCents: number
      expensesCents: number
      miles: number
    }
  >()

  for (const entry of entries) {
    const id =
      dimension === 'truck' ? entry.truckId ?? 'unassigned' : entry.garageId ?? 'unassigned'
    const trip = entry.tripId ? tripById.get(entry.tripId) ?? null : null
    const label = id === 'unassigned' ? 'Unassigned' : id
    const current = grouped.get(id) ?? {
      label,
      revenueCents: 0,
      expensesCents: 0,
      miles: 0,
    }

    if (entry.category === 'revenue') {
      current.revenueCents += Math.max(entry.amountCents, 0)
    } else {
      current.expensesCents += Math.abs(Math.min(entry.amountCents, 0))
    }

    if (trip?.id) {
      current.miles += tripMilesById.get(trip.id) ?? 0
    }

    grouped.set(id, current)
  }

  return [...grouped.entries()]
    .map(([id, item]) => ({
      id,
      label: item.label,
      miles: item.miles,
      revenueCents: item.revenueCents,
      expensesCents: item.expensesCents,
      netProfitCents: item.revenueCents - item.expensesCents,
      marginPercent:
        item.revenueCents > 0
          ? ((item.revenueCents - item.expensesCents) / item.revenueCents) * 100
          : null,
    }))
    .sort((left, right) => right.netProfitCents - left.netProfitCents)
}
