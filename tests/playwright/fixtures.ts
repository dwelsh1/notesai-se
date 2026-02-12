import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { settingsSelectors } from '../selectors/settings'

/** Create a new page and open it in the editor (clicks page-create, then the last Untitled link). */
export async function openNewPage(page: Page): Promise<void> {
  await page.getByTestId('page-create').click()
  await page
    .getByTestId('page-list')
    .getByRole('link', { name: /untitled/i })
    .last()
    .click()
}

/** Open Settings and switch to the Data Management tab (Backup/Import/Export). */
export async function gotoSettingsData(page: Page): Promise<void> {
  await page.getByTestId('nav-settings').click()
  await page.locator(settingsSelectors.dataTab).click()
}

/** Wait for save status "Saved", then for the current page link in the sidebar. Returns the page ID from the URL. */
export async function waitForSavedAndPageLink(page: Page, timeout = 10_000): Promise<string> {
  await page.locator('[data-testid="save-status"]').filter({ hasText: 'Saved' }).waitFor({ timeout })
  const pageId = page.url().match(/\/page\/([^/]+)/)?.[1]
  if (!pageId) throw new Error('No page ID in URL after save')
  await expect(page.locator(`[data-testid="page-link-${pageId}"]`)).toBeVisible({ timeout })
  return pageId
}

// Helper function to edit the H1 title in the editor and wait for it to appear in sidebar
export async function editPageTitle(page: Page, newTitle: string) {
  const h1 = page.locator('[data-testid="editor-content"] h1').first()
  await h1.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(newTitle)
  // Wait a bit for the debounced title update to process
  await page.waitForTimeout(600)
}

// Helper function to wait for a page title to appear in the sidebar
export async function waitForPageTitleInSidebar(page: Page, title: string, timeout = 30000) {
  // First, wait for the save status to appear if we just saved
  try {
    await page.locator('[data-testid="save-status"]').filter({ hasText: 'Saved' }).waitFor({ timeout: 10000 })
  } catch {
    // Save status might not be visible, continue anyway
  }

  // Get the current page ID from the URL
  const currentUrl = page.url()
  const pageIdMatch = currentUrl.match(/\/page\/([^/]+)/)
  const pageId = pageIdMatch ? pageIdMatch[1] : null

  // Wait for the async renamePage to complete and React to re-render
  // The onUpdate handler also calls renamePage, so we need to wait for state updates
  await page.waitForTimeout(3000)

  // Strategy: Wait for the specific page link (if we have the ID) to have the new title
  if (pageId) {
    // First, wait for the link to exist (it might still have the old title)
    const linkSelector = `[data-testid="page-link-${pageId}"], [data-testid="favorite-link-${pageId}"]`
    try {
      await page.waitForSelector(linkSelector, { timeout: 10000, state: 'attached' })
    } catch {
      // Link might not exist yet, continue anyway
    }

    // Now wait for the link text to match the expected title
    await page.waitForFunction(
      (args) => {
        const { pageId: id, expectedTitle } = args
        // Check page link first (most common case)
        const link = document.querySelector(`[data-testid="page-link-${id}"]`)
        if (link) {
          const linkText = link.textContent?.trim()
          return linkText === expectedTitle
        }
        // Also check favorite link (in case it's favorited)
        const favoriteLink = document.querySelector(`[data-testid="favorite-link-${id}"]`)
        if (favoriteLink) {
          const favoriteText = favoriteLink.textContent?.trim()
          return favoriteText === expectedTitle
        }
        return false
      },
      { pageId, expectedTitle: title },
      { timeout },
    )
    
    // Verify the link is visible
    await page.waitForSelector(linkSelector, { timeout: 5000, state: 'visible' })
    return
  }

  // Fallback: Wait for any link with the title text (if we don't have pageId)
  await page.waitForFunction(
    (expectedTitle) => {
      // Check page links
      const pageLinks = document.querySelectorAll('[data-testid^="page-link-"]')
      for (const link of pageLinks) {
        if (link.textContent?.trim() === expectedTitle) {
          return true
        }
      }
      // Check favorite links
      const favoriteLinks = document.querySelectorAll('[data-testid^="favorite-link-"]')
      for (const link of favoriteLinks) {
        if (link.textContent?.trim() === expectedTitle) {
          return true
        }
      }
      return false
    },
    title,
    { timeout: Math.max(10000, timeout - 10000) },
  )

  // Verify the link is visible
  await page.getByRole('link', { name: title, exact: true }).first().waitFor({
    timeout: 5000,
    state: 'visible',
  })
}

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
