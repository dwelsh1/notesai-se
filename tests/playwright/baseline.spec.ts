import { test, expect } from './fixtures'
import { appSelectors } from '../selectors/app'
import { dashboardSelectors } from '../selectors/dashboard'
import { settingsSelectors } from '../selectors/settings'

test('app boots to dashboard with empty state @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.locator(appSelectors.appShell)).toBeVisible()
  await expect(page.locator(appSelectors.sidebar)).toBeVisible()
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Dashboard')
  await expect(page.locator(appSelectors.sidebarEmpty)).toHaveText('No pages yet')
})

test('settings page is reachable @smoke', async ({ page }) => {
  await page.goto('/settings')

  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')
})
