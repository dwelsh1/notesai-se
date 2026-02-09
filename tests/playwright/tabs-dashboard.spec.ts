import { test, expect } from './fixtures'
import { tabsSelectors } from '../selectors/tabs'
import { dashboardSelectors } from '../selectors/dashboard'

test('tabs open and close when navigating to pages @phase3', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.locator(tabsSelectors.empty)).toBeVisible()

  await page.getByTestId('page-create').click()
  await page.getByRole('link', { name: /untitled/i }).click()

  await expect(page.locator(tabsSelectors.bar)).toBeVisible()
  await expect(page.getByTestId('tabs-empty')).not.toBeVisible()
  await expect(page.locator(tabsSelectors.item)).toHaveCount(1)

  await page.locator('[data-testid^="tab-close-"]').first().click()
  await expect(page.locator(tabsSelectors.empty)).toBeVisible()
})

test('dashboard shows recent, favorites, and stats @phase3', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await page.getByRole('button', { name: 'Rename page' }).click()
  await page.getByTestId('page-title-input').fill('Project Delta')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.getByRole('button', { name: 'Toggle favorite' }).click()

  await page.getByRole('link', { name: /dashboard/i }).click()

  await expect(page.locator(dashboardSelectors.stats)).toContainText('Total pages')
  await expect(page.locator(dashboardSelectors.favorites)).toContainText('Project Delta')
  await expect(page.locator(dashboardSelectors.recent)).toContainText('Project Delta')
})
