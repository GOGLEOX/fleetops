import path from 'node:path'
import { createFleetOpsDatabase } from '../electron/db/fleetops-database'

const database = createFleetOpsDatabase({
  databasePath: path.join(process.cwd(), '.fleetops', 'health-check.sqlite'),
})

database.initialize()
console.log(JSON.stringify(database.getHealth(), null, 2))
database.close()
