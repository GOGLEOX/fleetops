import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function TripsPage() {
  return (
    <EmptyStateCard
      section="Trips"
      summary="Trip ledger"
      detail="Trip records will appear here after FleetOps can reconcile telemetry signals into auditable run entries with manual correction when needed."
    />
  )
}
