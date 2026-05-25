import { useEffect, useState } from 'react'
import type { SessionTrackingSnapshot } from '../lib/session/contracts'
import {
  deferPendingTruck,
  getSessionSnapshot,
  ignorePendingTruck,
  onSessionState,
  registerPendingTruck,
} from '../platform/ipc'

export function useSessionTracking() {
  const [snapshot, setSnapshot] = useState<SessionTrackingSnapshot | null>(null)

  useEffect(() => {
    let active = true

    void getSessionSnapshot().then((result) => {
      if (active && result) {
        setSnapshot(result)
      }
    })

    const unsubscribe = onSessionState((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot)
      }
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  return {
    snapshot,
    registerPendingTruck: async (truckId: string) => {
      const result = await registerPendingTruck(truckId)
      if (result) {
        setSnapshot(result)
      }
    },
    ignorePendingTruck: async (truckId: string) => {
      const result = await ignorePendingTruck(truckId)
      if (result) {
        setSnapshot(result)
      }
    },
    deferPendingTruck: async (truckId: string) => {
      const result = await deferPendingTruck(truckId)
      if (result) {
        setSnapshot(result)
      }
    },
  }
}
