import path from 'node:path'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'

const database = createFleetOpsDatabase({
  databasePath: path.join(process.cwd(), '.fleetops', 'seed-check.sqlite'),
})

database.initialize()
console.log(
  JSON.stringify(
    {
      maintenanceRules: database.repositories.maintenanceRules.list(),
    },
    null,
    2,
  ),
)
database.close()
