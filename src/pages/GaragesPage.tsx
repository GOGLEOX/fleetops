import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function GaragesPage() {
  return (
    <EmptyStateCard
      section="Garages"
      summary="Garage records"
      detail="Garage records will stay manual or parser-assisted in future phases. This shell reserves the space for location management and assignment review."
    />
  )
}
