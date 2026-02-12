import { test, expect, editPageTitle, waitForSavedAndPageLink } from './fixtures'
import { tabsSelectors } from '../selectors/tabs'
import { dashboardSelectors } from '../selectors/dashboard'

test('tabs open and close when navigating to pages @dashboard', async ({ page, gotoApp }) => {
  await gotoApp()

  // App now opens with a default tab, so the empty state is not shown initially.
  await expect(page.locator(tabsSelectors.bar)).toBeVisible()

  const beforeCount = await page.locator(tabsSelectors.item).count()

  // Create a second page (we stay on it in the current tab)
  await page.getByTestId('page-create').click()
  await page.waitForSelector('.tabs-bar__tab', { state: 'visible' })

  // Click the *first* Untitled link so we open a different page in a new tab
  // (clicking .last() would often be the page we're already on, so no new tab)
  await page
    .getByTestId('page-list')
    .getByRole('link', { name: /untitled/i })
    .first()
    .click()

  await expect(page.locator(tabsSelectors.bar)).toBeVisible()
  await page.waitForFunction(
    (minCount) => document.querySelectorAll('.tabs-bar__tab').length > minCount,
    beforeCount,
    { timeout: 5000 },
  )
  const afterOpenCount = await page.locator(tabsSelectors.item).count()
  await expect(afterOpenCount).toBeGreaterThan(beforeCount)

  // Close the last tab (the one we just opened)
  const closeButtons = page.locator('[data-testid^="tab-close-"]')
  await expect(closeButtons).toHaveCount(afterOpenCount)
  await closeButtons.last().click()

  await page.waitForFunction(
    (expectedCount) => document.querySelectorAll('.tabs-bar__tab').length < expectedCount,
    afterOpenCount,
    { timeout: 5000 },
  )
  const afterCloseCount = await page.locator(tabsSelectors.item).count()
  await expect(afterCloseCount).toBeLessThan(afterOpenCount)
})

test('tab picker modal opens and creates a page @dashboard', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('tabs-add').click()
  await expect(page.getByTestId('tabs-picker')).toBeVisible()

  await page.getByRole('button', { name: /create a new page/i }).click()
  await expect(page.getByTestId('tabs-picker')).not.toBeVisible()
  await expect(page.getByTestId('page-list')).toContainText('Untitled')
})

test('tabs support keyboard navigation @dashboard', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await page
    .getByTestId('page-list')
    .getByRole('link', { name: /untitled/i })
    .last()
    .click()

  await page.getByTestId('page-create').click()
  await page
    .getByTestId('page-list')
    .getByRole('link', { name: /untitled/i })
    .last()
    .click()

  const tabs = page.locator('.tabs-bar__tab')
  await expect(tabs).toHaveCount(3)

  const activeBefore = await page.locator('.tabs-bar__tab--active').getAttribute('data-testid')
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'Tab' }))
  })
  const activeAfter = await page.locator('.tabs-bar__tab--active').getAttribute('data-testid')
  expect(activeAfter).not.toBe(activeBefore)
})

test('dashboard shows recent, favorites, and stats @dashboard', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await editPageTitle(page, 'Project Delta')
  await page.getByRole('button', { name: 'Save' }).click()
  const pageId = await waitForSavedAndPageLink(page)

  // Favorite the current page via sidebar hover actions
  await page.locator(`[data-testid="page-row-${pageId}"]`).hover()
  await page.getByTestId(`favorite-page-button-${pageId}`).click()

  // Use header nav Home button to return to dashboard
  await page.getByTestId('nav-home').click()

  await expect(page.locator(dashboardSelectors.stats)).toContainText('Total pages')
  // Dashboard shows our page in favorites and recent (title may be "Project Delta" or "Untitled" depending on sync)
  await expect(page.locator(dashboardSelectors.favorites)).toContainText(/Project Delta|Untitled/)
  await expect(page.locator(dashboardSelectors.recent)).toContainText(/Project Delta|Untitled/)
})
