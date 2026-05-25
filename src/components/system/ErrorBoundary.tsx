import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FleetOps renderer error', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#111315] px-6 text-stone-100">
          <section className="w-full max-w-xl rounded-2xl border border-stone-800 bg-stone-950/80 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
            <p className="text-xs uppercase tracking-[0.34em] text-amber-500">
              Application error
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-stone-50">
              The FleetOps shell stopped unexpectedly
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Restart the application to recover the renderer. No telemetry or
              database state is being modified in this shell-only phase.
            </p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
