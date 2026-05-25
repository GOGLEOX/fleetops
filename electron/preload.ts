import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('fleetops', {
  version: '0.1.0',
  getDatabaseHealth: () => ipcRenderer.invoke('fleetops:get-database-health'),
})
