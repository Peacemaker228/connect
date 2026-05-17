import { defineConfig, devices } from '@playwright/test'

const useRealMediaDevices = process.env.PLAYWRIGHT_REAL_MEDIA === '1'
const useScreenCapture = process.env.PLAYWRIGHT_SCREEN_CAPTURE === '1'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--autoplay-policy=no-user-gesture-required',
            ...(useRealMediaDevices
              ? []
              : ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']),
            ...(useScreenCapture
              ? ['--auto-select-desktop-capture-source=Entire screen', '--use-fake-ui-for-media-stream']
              : []),
          ],
        },
        permissions: ['camera', 'microphone'],
      },
    },
  ],
})
