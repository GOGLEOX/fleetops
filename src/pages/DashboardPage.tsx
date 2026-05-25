import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function DashboardPage() {
  return (
    <EmptyStateCard
      section="Dashboard"
      summary="Operational overview terminal"
      detail="The dashboard will surface current session status, unresolved operational items, and key fleet summaries once telemetry intake and local records are connected."
    />
  )
}
