import { test, expect, openNewPage, gotoSettingsData } from './fixtures'
import { appSelectors } from '../selectors/app'
import { dashboardSelectors } from '../selectors/dashboard'
import { editorSelectors } from '../selectors/editor'
import { settingsSelectors } from '../selectors/settings'
import { tabsSelectors } from '../selectors/tabs'

test('app boots to dashboard with empty state @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.locator(appSelectors.appShell)).toBeVisible()
  await expect(page.locator(appSelectors.sidebar)).toBeVisible()
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Dashboard')
  // App auto-creates a page if none exist, so check for page list instead
  await expect(page.locator('[data-testid="page-list"]')).toBeVisible()
})

test('theme toggle persists across reloads @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.click(appSelectors.themeToggle)
  await page.click(appSelectors.themeToggle)
  await expect(page.locator('html')).toHaveClass(/theme-dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/theme-dark/)
})

test('header nav buttons open dashboard and settings @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.click('[data-testid="nav-settings"]')
  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')

  await page.click('[data-testid="nav-home"]')
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Dashboard')
})

test('settings page is reachable @smoke', async ({ page }) => {
  await page.goto('http://localhost:5173/settings')
  await page.waitForSelector(settingsSelectors.title, { timeout: 15_000 })

  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')
})

test('header nav buttons route to dashboard and settings @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.click(appSelectors.themeToggle)
  await page.click('[data-testid="nav-settings"]')
  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')

  await page.click('[data-testid="nav-home"]')
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Dashboard')
})

test('regression flow: create page, run AI, insert response @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  // Mock before any AI action so no real request can slip through
  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: 'Regression AI output' } }],
      }),
    })
  })

  await openNewPage(page)

  await page.getByRole('button', { name: 'Open AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).toBeVisible()
  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.getByRole('button', { name: 'Run AI' }).click()
  await expect(page.locator(editorSelectors.aiResponse)).toContainText('Regression AI output', {
    timeout: 15_000,
  })

  await page.getByRole('button', { name: 'Insert into editor' }).click()
  await expect(page.locator(editorSelectors.contentArea)).toContainText('Regression AI output')

  // At least two tabs: initial + created page (may be more depending on product behavior)
  const tabCount = await page.locator(tabsSelectors.item).count()
  expect(tabCount).toBeGreaterThanOrEqual(2)
})

// --- Short smoke tests for critical flows (no heavy setup, quick runs) ---

test('tabs: bar visible and add-tab opens picker @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.locator(tabsSelectors.bar)).toBeVisible()
  await page.getByTestId('tabs-add').click()
  await expect(page.getByTestId('tabs-picker')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('tabs-picker')).not.toBeVisible()
})

test('semantic search modal opens via Sparkles @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('semantic-search-toggle').click()
  await expect(page.getByTestId('semantic-search-modal')).toBeVisible()
  await expect(page.getByTestId('semantic-search-modal').getByRole('heading', { name: 'Semantic Search' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('semantic-search-modal')).not.toBeVisible()
})

test('settings shows main tabs (General, Data, AI) @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('nav-settings').click()
  await expect(page.locator(settingsSelectors.title)).toHaveText('Settings')
  await expect(page.locator(settingsSelectors.generalTab)).toBeVisible()
  await expect(page.locator(settingsSelectors.dataTab)).toBeVisible()
  await expect(page.locator(settingsSelectors.aiTab)).toBeVisible()
})

test('Data Management tab shows Backup / Import / Export @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await gotoSettingsData(page)
  await expect(page.locator(settingsSelectors.backupTabButton)).toBeVisible()
  await expect(page.locator(settingsSelectors.importTabButton)).toBeVisible()
  await expect(page.locator(settingsSelectors.exportTabButton)).toBeVisible()
  await expect(page.locator(settingsSelectors.backupCard)).toBeVisible()
})

test('create page adds to sidebar and opens editor @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await openNewPage(page)
  await expect(page.getByTestId('page-list')).toContainText(/Untitled/i)
  await expect(page).toHaveURL(/\/page\//)
  await expect(page.locator(editorSelectors.contentArea)).toBeVisible()
})

test('sidebar page search filter is present @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.getByTestId('page-search')).toBeVisible()
  await expect(page.getByPlaceholder(/filter pages/i)).toBeVisible()
})
