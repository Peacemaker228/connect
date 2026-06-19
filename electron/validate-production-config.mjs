import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, 'app-config.json')
const rootPackagePath = path.join(__dirname, '..', 'package.json')
const electronPackagePath = path.join(__dirname, 'package.json')
const stagingBuilderConfigPath = path.join(__dirname, '..', 'electron-builder.staging.json')

const EXPECTED_CHANNELS = {
  production: {
    appId: 'com.axconnect.desktop',
    artifactName: '${productName}-Setup-${version}.${ext}',
    productName: 'AxConnect',
    protocol: 'axconnect',
    url: 'https://ax-connect.ru',
  },
  staging: {
    appId: 'com.axconnect.desktop.staging',
    artifactName: 'AxConnect-Staging-Setup-${version}.${ext}',
    productName: 'AxConnect Staging',
    protocol: 'axconnect-staging',
    updateUrl: 'https://staging.ax-connect.ru/downloads/desktop/staging/win/',
    url: 'https://staging.ax-connect.ru',
  },
}

const fail = (message) => {
  console.error(`[desktop-release] ${message}`)
  process.exit(1)
}

const getArgValue = (name, fallback) => {
  const index = process.argv.indexOf(name)

  if (index === -1) {
    return fallback
  }

  const value = process.argv[index + 1]

  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

const readJson = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${label}`)
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    fail(`Could not read ${label}: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

const assertUrl = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label} must be a non-empty URL`)
  }

  try {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) {
      fail(`${label} must start with http:// or https://`)
    }
  } catch {
    fail(`${label} must be a valid URL`)
  }
}

const channel = getArgValue('--channel', 'production')
const expected = EXPECTED_CHANNELS[channel]

if (!expected) {
  fail(`Unknown desktop channel: ${channel}`)
}

const config = readJson(configPath, 'electron/app-config.json')
const rootPackage = readJson(rootPackagePath, 'package.json')
const electronPackage = readJson(electronPackagePath, 'electron/package.json')

if (rootPackage?.version !== electronPackage?.version) {
  fail(
    `package.json version (${rootPackage?.version ?? 'unknown'}) and electron/package.json version (${electronPackage?.version ?? 'unknown'}) must match`,
  )
}

if (config.defaultChannel !== 'production') {
  fail('electron/app-config.json defaultChannel must remain production')
}

assertUrl(config.productionUrl, 'electron/app-config.json productionUrl')

if (config.productionUrl !== EXPECTED_CHANNELS.production.url) {
  fail(`Top-level productionUrl must remain ${EXPECTED_CHANNELS.production.url}`)
}

const channelConfig = config.channels?.[channel]

if (!channelConfig || typeof channelConfig !== 'object') {
  fail(`Missing electron/app-config.json channels.${channel}`)
}

assertUrl(channelConfig.productionUrl, `electron/app-config.json channels.${channel}.productionUrl`)

if (channelConfig.productionUrl !== expected.url) {
  fail(`Expected ${channel} productionUrl to be ${expected.url}`)
}

if (channelConfig.appId !== expected.appId) {
  fail(`Expected ${channel} appId to be ${expected.appId}`)
}

if (channelConfig.productName !== expected.productName) {
  fail(`Expected ${channel} productName to be ${expected.productName}`)
}

if (channelConfig.protocol !== expected.protocol) {
  fail(`Expected ${channel} protocol to be ${expected.protocol}`)
}

if (channel === 'staging') {
  assertUrl(channelConfig.updateUrl, 'electron/app-config.json channels.staging.updateUrl')

  if (channelConfig.updateUrl !== expected.updateUrl) {
    fail(`Expected staging updateUrl to be ${expected.updateUrl}`)
  }
}

if (channel === 'production') {
  const buildConfig = rootPackage?.build

  if (buildConfig?.appId !== expected.appId) {
    fail(`Expected root package build.appId to be ${expected.appId}`)
  }

  if (buildConfig?.productName !== expected.productName) {
    fail(`Expected root package build.productName to be ${expected.productName}`)
  }

  if (buildConfig?.win?.artifactName !== expected.artifactName) {
    fail(`Expected root package build.win.artifactName to be ${expected.artifactName}`)
  }
}

if (channel === 'staging') {
  const stagingBuilderConfig = readJson(stagingBuilderConfigPath, 'electron-builder.staging.json')

  if (stagingBuilderConfig.appId !== expected.appId) {
    fail(`Expected staging builder appId to be ${expected.appId}`)
  }

  if (stagingBuilderConfig.productName !== expected.productName) {
    fail(`Expected staging builder productName to be ${expected.productName}`)
  }

  if (stagingBuilderConfig.win?.artifactName !== expected.artifactName) {
    fail(`Expected staging builder artifactName to be ${expected.artifactName}`)
  }

  if (stagingBuilderConfig.extraMetadata?.axConnectDesktopChannel !== 'staging') {
    fail('Expected staging builder extraMetadata.axConnectDesktopChannel to be staging')
  }

  const publish = Array.isArray(stagingBuilderConfig.publish)
    ? stagingBuilderConfig.publish.find((item) => item?.provider === 'generic')
    : null

  if (!publish) {
    fail('Expected staging builder publish generic provider')
  }

  if (publish.url !== expected.updateUrl) {
    fail(`Expected staging builder publish url to be ${expected.updateUrl}`)
  }
}

console.log(`[desktop-release] ${channel} productionUrl OK: ${channelConfig.productionUrl}`)
console.log(`[desktop-release] ${channel} appId OK: ${channelConfig.appId}`)
console.log(`[desktop-release] ${channel} productName OK: ${channelConfig.productName}`)
console.log(`[desktop-release] version OK: ${rootPackage.version}`)
