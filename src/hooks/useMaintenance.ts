import { useCallback, useEffect, useState } from 'react'
import type {
  MaintenanceEventInput,
  MaintenanceRuleInput,
  MaintenanceSnapshot,
  TruckMaintenanceDetail,
} from '../lib/maintenance/contracts'
import {
  getMaintenanceSnapshot,
  getTruckMaintenanceDetail,
  logMaintenanceEvent,
  onSessionState,
  saveMaintenanceRule,
} from '../platform/ipc'

export function useMaintenance() {
  const [snapshot, setSnapshot] = useState<MaintenanceSnapshot | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null)
  const [selectedTruckDetail, setSelectedTruckDetail] =
    useState<TruckMaintenanceDetail | null>(null)

  const refreshMaintenance = useCallback(async () => {
    const nextSnapshot = await getMaintenanceSnapshot()
    if (!nextSnapshot) {
      return
    }

    setSnapshot(nextSnapshot)

    let nextSelectedTruckId = selectedTruckId
    if (
      nextSelectedTruckId &&
      !nextSnapshot.trucks.some((truck) => truck.id === nextSelectedTruckId)
    ) {
      nextSelectedTruckId = nextSnapshot.trucks[0]?.id ?? null
      setSelectedTruckId(nextSelectedTruckId)
    }

    if (nextSelectedTruckId) {
      const detail = await getTruckMaintenanceDetail(nextSelectedTruckId)
      setSelectedTruckDetail(detail)
      return
    }

    setSelectedTruckDetail(null)
  }, [selectedTruckId])

  useEffect(() => {
    let active = true

    void getMaintenanceSnapshot().then((result) => {
      if (!active || !result) {
        return
      }

      setSnapshot(result)
      const firstTruckId = result.dueNow[0]?.truck.id ?? result.dueSoon[0]?.truck.id ?? result.current[0]?.truck.id ?? result.trucks[0]?.id ?? null
      setSelectedTruckId((current) => current ?? firstTruckId)
    })

    const unsubscribe = onSessionState(() => {
      void refreshMaintenance()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [refreshMaintenance])

  useEffect(() => {
    void (selectedTruckId
      ? getTruckMaintenanceDetail(selectedTruckId)
      : Promise.resolve<TruckMaintenanceDetail | null>(null)
    ).then((detail) => {
      setSelectedTruckDetail(detail)
    })
  }, [selectedTruckId])

  return {
    snapshot,
    selectedTruckId,
    selectedTruckDetail,
    selectTruck: setSelectedTruckId,
    refreshMaintenance,
    saveMaintenanceRule: async (input: MaintenanceRuleInput) => {
      const rule = await saveMaintenanceRule(input)
      await refreshMaintenance()
      return rule
    },
    logMaintenanceEvent: async (input: MaintenanceEventInput) => {
      const detail = await logMaintenanceEvent(input)
      await refreshMaintenance()
      return detail
    },
  }
}
