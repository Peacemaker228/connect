import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const rootPackagePath = path.join(projectRoot, 'package.json')
const buildInfoPath = path.join(__dirname, 'build-info.json')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const runGit = (args) => {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  if (result.status !== 0) {
    return null
  }

  return result.stdout.trim() || null
}

const packageJson = readJson(rootPackagePath)
const commitHash = runGit(['rev-parse', 'HEAD'])
const shortCommitHash = runGit(['rev-parse', '--short', 'HEAD'])
const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'])
const isDirty = Boolean(runGit(['status', '--short']))

const buildInfo = {
  version: packageJson.version,
  commitHash,
  shortCommitHash,
  branch,
  isDirty,
  builtAt: new Date().toISOString(),
}

fs.writeFileSync(buildInfoPath, `${JSON.stringify(buildInfo, null, 2)}\n`)

console.log('[desktop] build info generated', buildInfo)
