import { NavLink } from 'react-router-dom'
import type { AppRouteDefinition } from '../../routes'
import { getDesktopRuntimeInfo } from '../../platform/ipc'
import { ConnectionPill } from '../status/ConnectionPill'

interface SidebarProps {
  currentPath: string
  routes: AppRouteDefinition[]
}

export function Sidebar({ currentPath, routes }: SidebarProps) {
  const runtimeInfo = getDesktopRuntimeInfo()
  const version = runtimeInfo?.version ?? '0.1.0'

  return (
    <aside className="border-b border-stone-800 bg-[#0d0f11] lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col">
        <div className="border-b border-stone-800 px-4 py-4 sm:px-5">
          <p className="text-[11px] uppercase tracking-[0.34em] text-amber-500">
            FleetOps
          </p>
          <h1 className="mt-2 font-['Bahnschrift','Segoe_UI',sans-serif] text-xl font-semibold tracking-[0.14em] text-stone-100">
            Desktop Terminal
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Local carrier operations companion for ATS sessions.
          </p>
        </div>

        <nav
          aria-label="Primary navigation"
          className="grid gap-1 px-3 py-3 sm:px-4"
        >
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'border-amber-700/70 bg-amber-500/10 text-stone-50'
                    : 'border-transparent text-stone-300 hover:border-stone-800 hover:bg-stone-900/80 hover:text-stone-100',
                ].join(' ')
              }
              aria-current={currentPath === route.path ? 'page' : undefined}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-[11px] font-semibold tracking-[0.18em] text-stone-300">
                {route.shortLabel}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{route.label}</span>
                <span className="block truncate text-xs text-stone-500">
                  {route.description}
                </span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-stone-800 px-4 py-4 sm:px-5">
          <ConnectionPill />
          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-stone-500">
            <span>Runtime</span>
            <span>v{version}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
