import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/playwright',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'playwright-smart-reporter',
      {
        outputFile: '../../playwright-reports/smart-report.html',
        historyFile: '../../playwright-reports/test-history-browser.json',
        maxHistoryRuns: 10,
        projectName: 'browser',
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
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
