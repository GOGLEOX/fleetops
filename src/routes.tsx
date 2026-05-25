import type { ReactElement } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { FleetPage } from './pages/FleetPage'
import { FinancePage } from './pages/FinancePage'
import { GaragesPage } from './pages/GaragesPage'
import { LiveSessionPage } from './pages/LiveSessionPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TripsPage } from './pages/TripsPage'

export const APP_ROUTES = {
  dashboard: '/dashboard',
  liveSession: '/live-session',
  trips: '/trips',
  fleet: '/fleet',
  garages: '/garages',
  maintenance: '/maintenance',
  finance: '/finance',
  reports: '/reports',
  settings: '/settings',
} as const

export interface AppRouteDefinition {
  path: (typeof APP_ROUTES)[keyof typeof APP_ROUTES]
  label: string
  shortLabel: string
  description: string
  element: ReactElement
}

export const appRoutes: AppRouteDefinition[] = [
  {
    path: APP_ROUTES.dashboard,
    label: 'Dashboard',
    shortLabel: 'D1',
    description: 'Operational overview and current terminal state.',
    element: <DashboardPage />,
  },
  {
    path: APP_ROUTES.liveSession,
    label: 'Live Session',
    shortLabel: 'L2',
    description: 'Current drive intake and telemetry session status.',
    element: <LiveSessionPage />,
  },
  {
    path: APP_ROUTES.trips,
    label: 'Trips',
    shortLabel: 'T3',
    description: 'Trip records and run history.',
    element: <TripsPage />,
  },
  {
    path: APP_ROUTES.fleet,
    label: 'Fleet',
    shortLabel: 'F4',
    description: 'Known trucks and asset registry.',
    element: <FleetPage />,
  },
  {
    path: APP_ROUTES.garages,
    label: 'Garages',
    shortLabel: 'G5',
    description: 'Owned locations and assigned operations.',
    element: <GaragesPage />,
  },
  {
    path: APP_ROUTES.maintenance,
    label: 'Maintenance',
    shortLabel: 'M6',
    description: 'Service history and maintenance tracking.',
    element: <MaintenancePage />,
  },
  {
    path: APP_ROUTES.finance,
    label: 'Finance',
    shortLabel: 'F7',
    description: 'Operating costs, revenue, and ledger review.',
    element: <FinancePage />,
  },
  {
    path: APP_ROUTES.reports,
    label: 'Reports',
    shortLabel: 'R8',
    description: 'Operational summaries and export-ready reporting.',
    element: <ReportsPage />,
  },
  {
    path: APP_ROUTES.settings,
    label: 'Settings',
    shortLabel: 'S9',
    description: 'Application preferences and telemetry setup.',
    element: <SettingsPage />,
  },
]

export const DEFAULT_ROUTE = appRoutes[0]
