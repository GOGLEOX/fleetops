import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const taskName = process.argv[2]

if (!taskName) {
  console.error('Missing database task name.')
  process.exit(1)
}

const taskScriptMap = {
  health: 'db-health.ts',
  seed: 'db-seed.ts',
  smoke: 'db-smoke.ts',
  session: 'session-smoke.ts',
  garage: 'garage-smoke.ts',
  maintenance: 'maintenance-smoke.ts',
  finance: 'finance-smoke.ts',
  reports: 'reports-smoke.ts',
}

const taskScript = taskScriptMap[taskName]

if (!taskScript) {
  console.error(`Unsupported database task: ${taskName}`)
  process.exit(1)
}

const electronBinary =
  process.platform === 'win32'
    ? path.join(
        process.cwd(),
        'node_modules',
        'electron',
        'dist',
        'electron.exe',
      )
    : path.join(process.cwd(), 'node_modules', '.bin', 'electron')

const scriptPath = path.join(process.cwd(), 'scripts', taskScript)

const result = spawnSync(
  electronBinary,
  ['--import', 'tsx', scriptPath],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
    },
    encoding: 'utf8',
  },
)

if (result.stdout) {
  process.stdout.write(result.stdout)
}

if (result.stderr) {
  process.stderr.write(result.stderr)
}

if (result.error) {
  console.error(result.error)
}

process.exit(result.status ?? 1)
