import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function FleetPage() {
  return (
    <EmptyStateCard
      section="Fleet"
      summary="Truck registry"
      detail="Fleet will track known player-operated trucks, ownership notes, and active-asset matching without claiming full company discovery from telemetry alone."
    />
  )
}
