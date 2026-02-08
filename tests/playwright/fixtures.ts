import { test as base } from '@playwright/test'

export const test = base.extend<{
  gotoApp: () => Promise<void>
}>({
  gotoApp: async ({ page }, use) => {
    await use(async () => {
      page.on('pageerror', (error) => {
        console.error('Page error:', error.message)
      })
      page.on('console', (message) => {
        if (message.type() === 'error') {
          console.error('Console error:', message.text())
        }
      })
      await page.goto('http://localhost:5173/')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15_000 })
    })
  },
})

export { expect } from '@playwright/test'
