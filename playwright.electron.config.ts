import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/playwright-electron',
  globalSetup: 'tests/playwright-electron/global-setup.ts',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'playwright-smart-reporter',
      {
        outputFile: '../../playwright-reports/smart-report-electron.html',
        historyFile: '../../playwright-reports/test-history-electron.json',
        maxHistoryRuns: 10,
        projectName: 'electron',
        enableAIRecommendations: true,
        enableFailureClustering: true,
        enableStabilityScore: true,
        enableGalleryView: true,
        enableComparison: true,
        enableTrendsView: true,
        enableTraceViewer: true,
        enableNetworkLogs: true,
      },
    ],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
