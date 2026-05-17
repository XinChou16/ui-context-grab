import { execFileSync } from 'node:child_process'

const OFFICIAL_REGISTRY = 'https://registry.npmjs.org/'

const registry = execFileSync('npm', ['config', 'get', 'registry'], {
  encoding: 'utf8',
}).trim()

if (registry !== OFFICIAL_REGISTRY) {
  console.error(
    `npm registry must be ${OFFICIAL_REGISTRY} before publishing. Current registry: ${registry}`,
  )
  console.error(`Run: npm config set registry ${OFFICIAL_REGISTRY}`)
  process.exit(1)
}

console.log(`npm registry: ${registry}`)
