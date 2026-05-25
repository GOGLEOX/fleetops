import { Outlet, useLocation } from 'react-router-dom'
import { appRoutes } from '../../routes'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

export function AppShell() {
  const location = useLocation()
  const currentRoute =
    appRoutes.find((route) => route.path === location.pathname) ?? appRoutes[0]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#181b1e_0%,_#111315_100%)] text-stone-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
        <Sidebar currentPath={location.pathname} routes={appRoutes} />
        <div className="flex min-h-screen min-w-0 flex-col">
          <StatusBar
            title={currentRoute.label}
            description={currentRoute.description}
          />
          <main className="flex-1 overflow-auto px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
