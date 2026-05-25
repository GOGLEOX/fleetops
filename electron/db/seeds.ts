import type { NewMaintenanceRuleRecord } from '../../src/lib/persistence/contracts'

export const maintenanceRuleSeeds: NewMaintenanceRuleRecord[] = [
  {
    id: 'engine-oil-service',
    name: 'Engine oil service',
    intervalMiles: 25000,
    intervalEngineHours: 500,
    enabled: true,
  },
  {
    id: 'drivetrain-inspection',
    name: 'Drivetrain inspection',
    intervalMiles: 50000,
    intervalEngineHours: null,
    enabled: true,
  },
  {
    id: 'tire-and-brake-check',
    name: 'Tire and brake check',
    intervalMiles: 15000,
    intervalEngineHours: null,
    enabled: true,
  },
]
