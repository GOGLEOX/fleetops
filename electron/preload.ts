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
  getFleetSnapshot: () => ipcRenderer.invoke('fleetops:get-fleet-snapshot'),
  getTruckDetail: (truckId: string) =>
    ipcRenderer.invoke('fleetops:get-truck-detail', truckId),
  registerDetectedTruck: (input: unknown) =>
    ipcRenderer.invoke('fleetops:register-detected-truck', input),
  updateTruck: (input: unknown) => ipcRenderer.invoke('fleetops:update-truck', input),
  getGarageSnapshot: () => ipcRenderer.invoke('fleetops:get-garage-snapshot'),
  getGarageDetail: (garageId: string) =>
    ipcRenderer.invoke('fleetops:get-garage-detail', garageId),
  saveGarage: (input: unknown) => ipcRenderer.invoke('fleetops:save-garage', input),
  assignTruckToGarage: (input: unknown) =>
    ipcRenderer.invoke('fleetops:assign-truck-to-garage', input),
  assignTripToGarage: (input: unknown) =>
    ipcRenderer.invoke('fleetops:assign-trip-to-garage', input),
  getMaintenanceSnapshot: () =>
    ipcRenderer.invoke('fleetops:get-maintenance-snapshot'),
  getTruckMaintenanceDetail: (truckId: string) =>
    ipcRenderer.invoke('fleetops:get-truck-maintenance-detail', truckId),
  saveMaintenanceRule: (input: unknown) =>
    ipcRenderer.invoke('fleetops:save-maintenance-rule', input),
  logMaintenanceEvent: (input: unknown) =>
    ipcRenderer.invoke('fleetops:log-maintenance-event', input),
  getFinanceSnapshot: () => ipcRenderer.invoke('fleetops:get-finance-snapshot'),
  saveFinanceEntry: (input: unknown) =>
    ipcRenderer.invoke('fleetops:save-finance-entry', input),
  deleteFinanceEntry: (entryId: string) =>
    ipcRenderer.invoke('fleetops:delete-finance-entry', entryId),
  getReportsSnapshot: () => ipcRenderer.invoke('fleetops:get-reports-snapshot'),
  generateReport: (input: unknown) => ipcRenderer.invoke('fleetops:generate-report', input),
  getSavedReport: (reportId: string) => ipcRenderer.invoke('fleetops:get-saved-report', reportId),
  exportReport: (reportId: string, format: 'html' | 'pdf') =>
    ipcRenderer.invoke('fleetops:export-report', reportId, format),
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
