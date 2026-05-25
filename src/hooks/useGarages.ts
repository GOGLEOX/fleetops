import { useCallback, useEffect, useState } from 'react'
import type {
  AssignTripToGarageInput,
  AssignTruckToGarageInput,
  GarageDetail,
  GarageSnapshot,
  GarageUpsertInput,
} from '../lib/garages/contracts'
import {
  assignTripToGarage,
  assignTruckToGarage,
  getGarageDetail,
  getGarageSnapshot,
  onSessionState,
  saveGarage,
} from '../platform/ipc'

export function useGarages() {
  const [snapshot, setSnapshot] = useState<GarageSnapshot | null>(null)
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null)
  const [selectedGarageDetail, setSelectedGarageDetail] =
    useState<GarageDetail | null>(null)

  const refreshGarages = useCallback(async () => {
    const nextSnapshot = await getGarageSnapshot()
    if (!nextSnapshot) {
      return
    }

    setSnapshot(nextSnapshot)

    let nextSelectedGarageId = selectedGarageId
    if (
      nextSelectedGarageId &&
      !nextSnapshot.garages.some(
        (garageItem) => garageItem.garage.id === nextSelectedGarageId,
      )
    ) {
      nextSelectedGarageId = nextSnapshot.garages[0]?.garage.id ?? null
      setSelectedGarageId(nextSelectedGarageId)
    }

    if (nextSelectedGarageId) {
      const detail = await getGarageDetail(nextSelectedGarageId)
      setSelectedGarageDetail(detail)
      return
    }

    setSelectedGarageDetail(null)
  }, [selectedGarageId])

  useEffect(() => {
    let active = true

    void getGarageSnapshot().then((result) => {
      if (!active || !result) {
        return
      }

      setSnapshot(result)
      const firstGarageId = result.garages[0]?.garage.id ?? null
      setSelectedGarageId((current) => current ?? firstGarageId)
    })

    const unsubscribe = onSessionState(() => {
      void refreshGarages()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [refreshGarages])

  useEffect(() => {
    void (selectedGarageId
      ? getGarageDetail(selectedGarageId)
      : Promise.resolve<GarageDetail | null>(null)
    ).then((detail) => {
      setSelectedGarageDetail(detail)
    })
  }, [selectedGarageId])

  return {
    snapshot,
    selectedGarageId,
    selectedGarageDetail,
    selectGarage: setSelectedGarageId,
    refreshGarages,
    saveGarage: async (input: GarageUpsertInput) => {
      const detail = await saveGarage(input)
      await refreshGarages()
      if (detail) {
        setSelectedGarageId(detail.garage.id)
      }
      return detail
    },
    assignTruckToGarage: async (input: AssignTruckToGarageInput) => {
      const detail = await assignTruckToGarage(input)
      await refreshGarages()
      return detail
    },
    assignTripToGarage: async (input: AssignTripToGarageInput) => {
      const detail = await assignTripToGarage(input)
      await refreshGarages()
      return detail
    },
  }
}
