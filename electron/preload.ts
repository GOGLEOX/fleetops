import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('fleetops', {
  version: '0.1.0',
})
