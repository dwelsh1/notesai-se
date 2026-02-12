import { test, expect } from './fixtures'

// Semantic search is now a modal opened by the Sparkles button or Ctrl/Cmd+Shift+K.
// Sidebar search is always text-only ("Filter pages...").

test.describe('Semantic Search (modal)', () => {
  test('opens modal via Sparkles button and shows idle state @sem-search', async ({ page, gotoApp }) => {
    await gotoApp()

    const toggle = page.getByTestId('semantic-search-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()

    const modal = page.getByTestId('semantic-search-modal')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('heading', { name: 'Semantic Search' })).toBeVisible()
    await expect(page.getByPlaceholder('Search by meaning…')).toBeVisible()
    await expect(page.getByTestId('semantic-search-idle')).toBeVisible()
    await expect(page.getByText('Search by Meaning')).toBeVisible()
  })

  test('opens modal via Ctrl+Shift+K @sem-search', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.keyboard.press('Control+Shift+K')
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()
    await expect(page.getByTestId('semantic-search-idle')).toBeVisible()
  })

  test('closes modal with Esc @sem-search', async ({ page, gotoApp }) => {
    await gotoApp()
    await page.getByTestId('semantic-search-toggle').click()
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('semantic-search-modal')).not.toBeVisible()
  })

  test('closes modal via Close button @sem-search', async ({ page, gotoApp }) => {
    await gotoApp()
    await page.getByTestId('semantic-search-toggle').click()
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()

    await page.getByTestId('semantic-search-modal').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByTestId('semantic-search-modal')).not.toBeVisible()
  })

  test('closes modal when clicking backdrop @sem-search', async ({ page, gotoApp }) => {
    await gotoApp()
    await page.getByTestId('semantic-search-toggle').click()
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()

    await page.getByTestId('semantic-search-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('semantic-search-modal')).not.toBeVisible()
  })

  test('shows unavailable state when AI not connected @sem-search', async ({
    page,
    gotoApp,
    context,
  }) => {
    // Block LM Studio endpoints so the app sees "unavailable"
    await context.route('**/v1/**', (route) => route.abort())
    await context.route('**/models', (route) => route.abort())

    await gotoApp()
    await page.getByTestId('semantic-search-toggle').click()
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()

    // Wait for availability check (async)
    await expect(page.getByTestId('semantic-search-unavailable')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Semantic Search Unavailable')).toBeVisible()
  })

  test('typing in modal shows loading then no-results when no embeddings @sem-search', async ({
    page,
    gotoApp,
    context,
  }) => {
    // Mock connection (models) and embeddings so semantic search is "available" and query runs
    const embedding = Array(384).fill(0.1)
    await context.route('**/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'embed-model' }] }),
      })
    })
    await context.route('**/v1/embeddings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ embedding }] }),
      })
    })

    await gotoApp()
    await page.getByTestId('semantic-search-toggle').click()
    await expect(page.getByTestId('semantic-search-modal')).toBeVisible()
    // Wait for available (idle state)
    await expect(page.getByTestId('semantic-search-idle')).toBeVisible({ timeout: 10000 })

    const input = page.getByTestId('semantic-search-input')
    await input.fill('how to manage projects')
    // Debounce 300ms + request; then we get no results (no stored page embeddings in test DB)
    await expect(page.getByTestId('semantic-search-no-results')).toBeVisible({ timeout: 8000 })
  })
})
