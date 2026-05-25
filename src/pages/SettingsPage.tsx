import { EmptyStateCard } from '../components/content/EmptyStateCard'

export function SettingsPage() {
  return (
    <EmptyStateCard
      section="Settings"
      summary="Application configuration"
      detail="Settings will contain local preferences, telemetry bridge setup, export defaults, and other workstation-specific configuration."
    />
  )
}
