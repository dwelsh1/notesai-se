import { test, expect, _electron as electron } from '@playwright/test'
import { appSelectors } from '../selectors/app'
import { dashboardSelectors } from '../selectors/dashboard'
import { settingsSelectors } from '../selectors/settings'

const electronArgs = process.env.CI
  ? ['dist-electron/main.js', '--no-sandbox', '--disable-setuid-sandbox']
  : ['dist-electron/main.js']

test('electron app boots to dashboard with empty state @smoke @electron', async () => {
  const electronApp = await electron.launch({
    args: electronArgs,
    env: { ...process.env, E2E: 'true' },
  })
  const page = await electronApp.firstWindow()

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator(appSelectors.appShell)).toBeVisible({ timeout: 20_000 })
  await expect(page.locator(appSelectors.sidebar)).toBeVisible()
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Dashboard')
  await expect(page.locator(appSelectors.sidebarEmpty)).toHaveText('No pages yet')

  await electronApp.close()
})

test('electron app can reach settings @smoke @electron', async () => {
  const electronApp = await electron.launch({
    args: electronArgs,
    env: { ...process.env, E2E: 'true' },
  })
  const page = await electronApp.firstWindow()

  await page.goto('http://localhost:5173/settings')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')

  await electronApp.close()
})
