import type { NewMaintenanceRuleRecord } from '../../src/lib/persistence/contracts'

export const maintenanceRuleSeeds: NewMaintenanceRuleRecord[] = [
  {
    id: 'oil-service',
    name: 'Oil service',
    intervalMiles: 15000,
    intervalEngineHours: null,
    enabled: true,
  },
  {
    id: 'tire-inspection',
    name: 'Tire inspection',
    intervalMiles: 10000,
    intervalEngineHours: null,
    enabled: true,
  },
  {
    id: 'brake-inspection',
    name: 'Brake inspection',
    intervalMiles: 20000,
    intervalEngineHours: null,
    enabled: true,
  },
  {
    id: 'dot-style-inspection',
    name: 'DOT-style inspection',
    intervalMiles: 25000,
    intervalEngineHours: null,
    enabled: true,
  },
  {
    id: 'major-service',
    name: 'Major service',
    intervalMiles: 50000,
    intervalEngineHours: null,
    enabled: true,
  },
]
