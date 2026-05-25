import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  calculateFinanceTotals,
  calculateProfitabilityRows,
  filterFinanceEntries,
  filterTripsForFinance,
} from '../lib/finance/calculations'
import type {
  FinanceEntryInput,
  FinanceFilters,
  FinanceSnapshot,
} from '../lib/finance/contracts'
import {
  deleteFinanceEntry,
  getFinanceSnapshot,
  onSessionState,
  saveFinanceEntry,
} from '../platform/ipc'

const DEFAULT_FILTERS: FinanceFilters = {
  dateFrom: '',
  dateTo: '',
  truckId: '',
  garageId: '',
  category: 'all',
}

export function useFinance() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null)
  const [filters, setFilters] = useState<FinanceFilters>(DEFAULT_FILTERS)

  const refreshFinance = useCallback(async () => {
    const nextSnapshot = await getFinanceSnapshot()
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }, [])

  useEffect(() => {
    let active = true

    void getFinanceSnapshot().then((result) => {
      if (active && result) {
        setSnapshot(result)
      }
    })

    const unsubscribe = onSessionState(() => {
      void refreshFinance()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [refreshFinance])

  const filteredEntries = useMemo(
    () => filterFinanceEntries(snapshot?.entries ?? [], filters),
    [snapshot?.entries, filters],
  )
  const filteredTrips = useMemo(
    () => filterTripsForFinance(snapshot?.trips ?? [], filters),
    [snapshot?.trips, filters],
  )
  const totals = useMemo(
    () => calculateFinanceTotals(filteredEntries, filteredTrips),
    [filteredEntries, filteredTrips],
  )
  const truckProfitability = useMemo(
    () => calculateProfitabilityRows(filteredEntries, filteredTrips, 'truck'),
    [filteredEntries, filteredTrips],
  )
  const garageProfitability = useMemo(
    () => calculateProfitabilityRows(filteredEntries, filteredTrips, 'garage'),
    [filteredEntries, filteredTrips],
  )

  return {
    snapshot,
    filters,
    setFilters,
    filteredEntries,
    filteredTrips,
    totals,
    truckProfitability,
    garageProfitability,
    refreshFinance,
    saveFinanceEntry: async (input: FinanceEntryInput) => {
      const entry = await saveFinanceEntry(input)
      await refreshFinance()
      return entry
    },
    deleteFinanceEntry: async (entryId: string) => {
      const deleted = await deleteFinanceEntry(entryId)
      await refreshFinance()
      return deleted
    },
  }
}
