import { test as base } from '@playwright/test'

export const test = base.extend<{
  gotoApp: () => Promise<void>
}>({
  gotoApp: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/')
    })
  },
})

export { expect } from '@playwright/test'
