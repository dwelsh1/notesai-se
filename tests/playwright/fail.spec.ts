/**
 * Intentional failure spec for validating Smart Report and AI failure analysis.
 * Run with: npx playwright test fail.spec.ts
 * Then open the report: npm run test:e2e:report
 */
import { test, expect } from './fixtures'
import { appSelectors } from '../selectors/app'
import { dashboardSelectors } from '../selectors/dashboard'

test('intentional failure for Smart Report / AI testing @smoke', async ({ page, gotoApp }) => {
  await gotoApp()

  await expect(page.locator(appSelectors.appShell)).toBeVisible()
  await expect(page.locator(appSelectors.sidebar)).toBeVisible()

  // Intentional failure: dashboard title is "Dashboard", not "Expected to fail"
  await expect(page.locator(dashboardSelectors.title)).toHaveText('Expected to fail')
})

test.skip('intentional skip for Smart Report @smoke', async ({ page, gotoApp }) => {
  await gotoApp()
  await expect(page.locator(appSelectors.sidebar)).toBeVisible()
})
