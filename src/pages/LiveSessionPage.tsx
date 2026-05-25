import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function LiveSessionPage() {
  return (
    <EmptyStateCard
      section="Live Session"
      summary="Current drive intake"
      detail="This page will monitor the active ATS session, show bridge health, and stage proposed trip details before they become durable records."
    />
  )
}
