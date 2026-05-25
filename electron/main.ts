import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeAppDatabase, initializeAppDatabase } from './db/app-database'
import {
  closeTelemetryService,
  initializeTelemetryService,
} from './telemetry/app-telemetry'
import {
  closeSessionTrackingService,
  initializeSessionTrackingService,
} from './session/app-session'
import { initializeFleetService } from './fleet/app-fleet'
import { initializeGarageService } from './garages/app-garages'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TELEMETRY_STATE_CHANNEL = 'fleetops:telemetry-state'
const TELEMETRY_FRAME_CHANNEL = 'fleetops:telemetry-frame'
const TELEMETRY_EVENT_CHANNEL = 'fleetops:telemetry-event'
const SESSION_STATE_CHANNEL = 'fleetops:session-state'

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0b0d0f',
    title: 'FleetOps Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  const database = initializeAppDatabase()
  const telemetryService = await initializeTelemetryService()
  const sessionTrackingService = await initializeSessionTrackingService()
  const fleetService = initializeFleetService()
  const garageService = initializeGarageService()

  ipcMain.handle('fleetops:get-database-health', () => database.getHealth())
  ipcMain.handle('fleetops:get-telemetry-snapshot', () =>
    telemetryService.getSnapshot(),
  )
  ipcMain.handle('fleetops:set-mock-telemetry-enabled', (_, enabled: boolean) =>
    telemetryService.setMockMode(enabled),
  )
  ipcMain.handle('fleetops:get-session-snapshot', () =>
    sessionTrackingService.getSnapshot(),
  )
  ipcMain.handle('fleetops:register-pending-truck', (_, truckId: string) =>
    sessionTrackingService.registerPendingTruck(truckId),
  )
  ipcMain.handle('fleetops:ignore-pending-truck', (_, truckId: string) =>
    sessionTrackingService.ignorePendingTruck(truckId),
  )
  ipcMain.handle('fleetops:defer-pending-truck', (_, truckId: string) =>
    sessionTrackingService.deferPendingTruck(truckId),
  )
  ipcMain.handle('fleetops:get-fleet-snapshot', () => fleetService.getSnapshot())
  ipcMain.handle('fleetops:get-truck-detail', (_, truckId: string) =>
    fleetService.getTruckDetail(truckId),
  )
  ipcMain.handle(
    'fleetops:register-detected-truck',
    (_, input: {
      truckId: string
      displayName: string
      detectedMake: string | null
      detectedModel: string | null
      startingOdometerMi: number | null
      notes: string | null
    }) => fleetService.registerDetectedTruck(input),
  )
  ipcMain.handle(
    'fleetops:update-truck',
    (_, input: {
      truckId: string
      displayName: string
      detectedMake: string | null
      detectedModel: string | null
      startingOdometerMi: number | null
      currentOdometerMi: number | null
      notes: string | null
      status: 'active' | 'parked' | 'maintenance' | 'retired' | 'pending' | 'ignored'
    }) => fleetService.updateTruck(input),
  )
  ipcMain.handle('fleetops:get-garage-snapshot', () =>
    garageService.getSnapshot(),
  )
  ipcMain.handle('fleetops:get-garage-detail', (_, garageId: string) =>
    garageService.getGarageDetail(garageId),
  )
  ipcMain.handle(
    'fleetops:save-garage',
    (_, input: {
      garageId?: string
      name: string
      city: string
      state: string
      divisionName: string | null
      notes: string | null
    }) => garageService.saveGarage(input),
  )
  ipcMain.handle(
    'fleetops:assign-truck-to-garage',
    (_, input: {
      truckId: string
      garageId: string
      notes: string | null
    }) => garageService.assignTruck(input),
  )
  ipcMain.handle(
    'fleetops:assign-trip-to-garage',
    (_, input: {
      tripId: string
      garageId: string | null
    }) => garageService.assignTrip(input),
  )

  telemetryService.subscribeState((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(TELEMETRY_STATE_CHANNEL, snapshot)
    }
  })

  telemetryService.subscribeFrame((frame) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(TELEMETRY_FRAME_CHANNEL, frame)
    }
  })

  telemetryService.subscribeEvent((event) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(TELEMETRY_EVENT_CHANNEL, event)
    }
  })

  sessionTrackingService.subscribeState((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(SESSION_STATE_CHANNEL, snapshot)
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    void closeSessionTrackingService()
    void closeTelemetryService()
    closeAppDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  void closeSessionTrackingService()
  void closeTelemetryService()
  closeAppDatabase()
})
