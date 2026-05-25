import { useCallback, useEffect, useState } from 'react'
import type {
  FleetSnapshot,
  FleetTruckDetail,
  RegisterDetectedTruckInput,
  UpdateTruckInput,
} from '../lib/fleet/contracts'
import {
  getFleetSnapshot,
  getTruckDetail,
  registerDetectedTruck,
  updateTruck,
} from '../platform/ipc'
import { onSessionState } from '../platform/ipc'

export function useFleet() {
  const [snapshot, setSnapshot] = useState<FleetSnapshot | null>(null)
  const [selectedTruckDetail, setSelectedTruckDetail] =
    useState<FleetTruckDetail | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null)

  const refreshFleet = useCallback(async () => {
    const nextSnapshot = await getFleetSnapshot()
    if (!nextSnapshot) {
      return
    }

    setSnapshot(nextSnapshot)

    let nextSelectedTruckId = selectedTruckId

    if (
      nextSelectedTruckId &&
      !nextSnapshot.trucks.some((truck) => truck.truck.id === nextSelectedTruckId)
    ) {
      nextSelectedTruckId = nextSnapshot.trucks[0]?.truck.id ?? null
      setSelectedTruckId(nextSelectedTruckId)
    }

    if (nextSelectedTruckId) {
      const detail = await getTruckDetail(nextSelectedTruckId)
      setSelectedTruckDetail(detail)
      return
    }

    setSelectedTruckDetail(null)
  }, [selectedTruckId])

  useEffect(() => {
    let active = true

    void getFleetSnapshot().then((result) => {
      if (active && result) {
        setSnapshot(result)
        const firstTruckId = result.trucks[0]?.truck.id ?? null
        setSelectedTruckId((current) => current ?? firstTruckId)
      }
    })

    const unsubscribe = onSessionState(() => {
      void refreshFleet()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [refreshFleet])

  useEffect(() => {
    void (selectedTruckId
      ? getTruckDetail(selectedTruckId)
      : Promise.resolve<FleetTruckDetail | null>(null)
    ).then((detail) => {
      setSelectedTruckDetail(detail)
    })
  }, [selectedTruckId])

  return {
    snapshot,
    selectedTruckId,
    selectedTruckDetail,
    selectTruck: setSelectedTruckId,
    refreshFleet,
    registerDetectedTruck: async (input: RegisterDetectedTruckInput) => {
      const detail = await registerDetectedTruck(input)
      await refreshFleet()
      if (detail) {
        setSelectedTruckId(detail.truck.id)
      }
      return detail
    },
    updateTruck: async (input: UpdateTruckInput) => {
      const detail = await updateTruck(input)
      await refreshFleet()
      return detail
    },
  }
}
