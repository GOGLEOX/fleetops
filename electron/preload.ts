import { contextBridge, ipcRenderer } from 'electron'

const TELEMETRY_STATE_CHANNEL = 'fleetops:telemetry-state'
const TELEMETRY_FRAME_CHANNEL = 'fleetops:telemetry-frame'
const TELEMETRY_EVENT_CHANNEL = 'fleetops:telemetry-event'
const SESSION_STATE_CHANNEL = 'fleetops:session-state'

contextBridge.exposeInMainWorld('fleetops', {
  version: '0.1.0',
  getDatabaseHealth: () => ipcRenderer.invoke('fleetops:get-database-health'),
  getTelemetrySnapshot: () => ipcRenderer.invoke('fleetops:get-telemetry-snapshot'),
  setMockTelemetryEnabled: (enabled: boolean) =>
    ipcRenderer.invoke('fleetops:set-mock-telemetry-enabled', enabled),
  getSessionSnapshot: () => ipcRenderer.invoke('fleetops:get-session-snapshot'),
  registerPendingTruck: (truckId: string) =>
    ipcRenderer.invoke('fleetops:register-pending-truck', truckId),
  ignorePendingTruck: (truckId: string) =>
    ipcRenderer.invoke('fleetops:ignore-pending-truck', truckId),
  deferPendingTruck: (truckId: string) =>
    ipcRenderer.invoke('fleetops:defer-pending-truck', truckId),
  onTelemetryState: (callback: (snapshot: unknown) => void) => {
    const listener = (_event: unknown, snapshot: unknown) => {
      callback(snapshot)
    }
    ipcRenderer.on(TELEMETRY_STATE_CHANNEL, listener)
    return () => {
      ipcRenderer.removeListener(TELEMETRY_STATE_CHANNEL, listener)
    }
  },
  onTelemetryFrame: (callback: (frame: unknown) => void) => {
    const listener = (_event: unknown, frame: unknown) => {
      callback(frame)
    }
    ipcRenderer.on(TELEMETRY_FRAME_CHANNEL, listener)
    return () => {
      ipcRenderer.removeListener(TELEMETRY_FRAME_CHANNEL, listener)
    }
  },
  onTelemetryEvent: (callback: (event: unknown) => void) => {
    const listener = (_event: unknown, telemetryEvent: unknown) => {
      callback(telemetryEvent)
    }
    ipcRenderer.on(TELEMETRY_EVENT_CHANNEL, listener)
    return () => {
      ipcRenderer.removeListener(TELEMETRY_EVENT_CHANNEL, listener)
    }
  },
  onSessionState: (callback: (snapshot: unknown) => void) => {
    const listener = (_event: unknown, snapshot: unknown) => {
      callback(snapshot)
    }
    ipcRenderer.on(SESSION_STATE_CHANNEL, listener)
    return () => {
      ipcRenderer.removeListener(SESSION_STATE_CHANNEL, listener)
    }
  },
})
