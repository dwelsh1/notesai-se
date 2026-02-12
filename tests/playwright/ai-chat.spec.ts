import { test, expect } from './fixtures'

test.describe('AI Chat panel', () => {
  test('opens and shows empty state when toggled from sidebar @ai @chat', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()
    await page.getByTestId('ai-chat-toggle').click()
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
    await expect(page.getByTestId('ai-chat-header')).toBeVisible()
    await expect(page.getByTestId('ai-chat-title')).toHaveText('AI Chat')
    await expect(page.getByTestId('ai-chat-connection-status')).toBeVisible()
    await expect(page.getByTestId('ai-chat-empty-state')).toBeVisible()
    await expect(page.getByText('Start a conversation with AI')).toBeVisible()
    await expect(page.getByTestId('ai-chat-input')).toBeVisible()
    await expect(page.getByTestId('ai-chat-send')).toBeVisible()
  })

  test('closes when close button is clicked @ai @chat', async ({ page, gotoApp }) => {
    await gotoApp()
    await page.getByTestId('ai-chat-toggle').click()
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
    await page.getByTestId('ai-chat-close').click()
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0)
  })

  test('can be toggled with keyboard Ctrl+Shift+C @ai @chat', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()
    await page.keyboard.press('Control+Shift+C')
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
    await page.keyboard.press('Control+Shift+C')
    await expect(page.getByTestId('ai-chat-panel')).toHaveCount(0)
  })

  test('New chat button creates new session @ai @chat', async ({ page, gotoApp }) => {
    await gotoApp()
    await page.getByTestId('ai-chat-toggle').click()
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
    await page.getByTestId('ai-chat-new').click()
    await expect(page.getByTestId('ai-chat-empty-state')).toBeVisible()
  })

  test('Export button is disabled when no messages @ai @chat', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()
    await page.getByTestId('ai-chat-toggle').click()
    await expect(page.getByTestId('ai-chat-export')).toBeDisabled()
  })

  test('sends message and shows user and assistant messages when API is mocked @ai @chat', async ({
    page,
    gotoApp,
  }) => {
    await page.route('**/v1/chat/completions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{ message: { content: 'Mocked assistant reply for tests.' } }],
        }),
      })
    })

    await gotoApp()
    await page.getByTestId('ai-chat-toggle').click()
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible()

    await page.getByTestId('ai-chat-input').fill('Hello, AI')
    await page.getByTestId('ai-chat-send').click()

    const userMsg = page.getByTestId('ai-chat-message-user').filter({ hasText: 'Hello, AI' })
    await expect(userMsg).toHaveCount(1, { timeout: 15_000 })
    await expect(userMsg).toContainText('Hello, AI')

    const assistantMsg = page
      .getByTestId('ai-chat-message-assistant')
      .filter({ hasText: 'Mocked assistant reply' })
    await expect(assistantMsg).toHaveCount(1, { timeout: 15_000 })
    await expect(assistantMsg).toContainText('Mocked assistant reply')
  })
})
