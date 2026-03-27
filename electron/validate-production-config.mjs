import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, 'app-config.json')
const rootPackagePath = path.join(__dirname, '..', 'package.json')
const electronPackagePath = path.join(__dirname, 'package.json')

const fail = (message) => {
  console.error(`[desktop-release] ${message}`)
  process.exit(1)
}

if (!fs.existsSync(configPath)) {
  fail('Не найден electron/app-config.json')
}

let config
let rootPackage
let electronPackage

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
} catch (error) {
  fail(`Не удалось прочитать electron/app-config.json: ${error instanceof Error ? error.message : 'unknown error'}`)
}

try {
  rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'))
  electronPackage = JSON.parse(fs.readFileSync(electronPackagePath, 'utf8'))
} catch (error) {
  fail(`Не удалось прочитать package.json с версиями: ${error instanceof Error ? error.message : 'unknown error'}`)
}

const productionUrl = config?.productionUrl

if (typeof productionUrl !== 'string' || productionUrl.trim() === '') {
  fail('Заполните productionUrl в electron/app-config.json перед production release')
}

try {
  const url = new URL(productionUrl)

  if (!['http:', 'https:'].includes(url.protocol)) {
    fail('productionUrl должен начинаться с http:// или https://')
  }
} catch {
  fail('productionUrl должен быть валидным URL')
}

if (rootPackage?.version !== electronPackage?.version) {
  fail(
    `Версии package.json (${rootPackage?.version ?? 'unknown'}) и electron/package.json (${electronPackage?.version ?? 'unknown'}) должны совпадать`,
  )
}

console.log(`[desktop-release] productionUrl OK: ${productionUrl}`)
console.log(`[desktop-release] version OK: ${rootPackage.version}`)
