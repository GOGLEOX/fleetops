export type FeatureArea =
  | 'telemetry'
  | 'trips'
  | 'trucks'
  | 'garages'
  | 'maintenance'
  | 'finance'
  | 'reports'
  | 'settings'
  | 'exports'

export interface ModuleBoundaryNote {
  area: FeatureArea
  responsibility: string
  excludedFromMvp: string
}
