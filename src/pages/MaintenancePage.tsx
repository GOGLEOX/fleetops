import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function MaintenancePage() {
  return (
    <EmptyStateCard
      section="Maintenance"
      summary="Service tracking"
      detail="Maintenance will hold service events, wear notes, and upkeep intervals tied to known trucks once the local data spine is in place."
    />
  )
}
