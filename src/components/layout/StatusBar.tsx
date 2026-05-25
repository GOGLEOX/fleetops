import { getDesktopRuntimeInfo } from '../../platform/ipc'
import { ConnectionPill } from '../status/ConnectionPill'

interface StatusBarProps {
  title: string
  description: string
}

export function StatusBar({ title, description }: StatusBarProps) {
  const runtimeInfo = getDesktopRuntimeInfo()

  return (
    <header className="border-b border-stone-800 bg-[#121518]/95 px-4 py-3 backdrop-blur sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
            {title}
          </p>
          <div className="mt-1 flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
            <h2 className="truncate text-lg font-semibold text-stone-100">
              {title}
            </h2>
            <span className="hidden text-stone-700 lg:inline">/</span>
            <p className="text-sm text-stone-400">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ConnectionPill compact />
          <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-2 text-xs text-stone-400">
            App version{' '}
            <span className="font-medium text-stone-200">
              v{runtimeInfo?.version ?? '0.1.0'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
