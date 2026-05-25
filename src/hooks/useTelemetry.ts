import { useEffect, useState } from 'react'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
  TelemetryServiceSnapshot,
} from '../lib/telemetry/contracts'
import {
  getTelemetrySnapshot,
  onTelemetryEvent,
  onTelemetryFrame,
  onTelemetryState,
} from '../platform/ipc'

export function useTelemetry() {
  const [snapshot, setSnapshot] = useState<TelemetryServiceSnapshot | null>(null)
  const [events, setEvents] = useState<NormalizedTelemetryEvent[]>([])
  const [latestFrame, setLatestFrame] = useState<NormalizedTelemetryFrame | null>(
    null,
  )

  useEffect(() => {
    let active = true

    void getTelemetrySnapshot().then((result) => {
      if (!active || !result) {
        return
      }

      setSnapshot(result)
      setLatestFrame(result.currentFrame)
    })

    const unsubscribeState = onTelemetryState((nextSnapshot) => {
      if (!active) {
        return
      }

      setSnapshot(nextSnapshot)
      setLatestFrame(nextSnapshot.currentFrame)
    })

    const unsubscribeFrame = onTelemetryFrame((frame) => {
      if (active) {
        setLatestFrame(frame)
      }
    })

    const unsubscribeEvent = onTelemetryEvent((event) => {
      if (active) {
        setEvents((current) => [event, ...current].slice(0, 8))
      }
    })

    return () => {
      active = false
      unsubscribeState?.()
      unsubscribeFrame?.()
      unsubscribeEvent?.()
    }
  }, [])

  return {
    snapshot,
    latestFrame,
    events,
  }
}
