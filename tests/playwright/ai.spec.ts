import { test, expect } from './fixtures'
import { editorSelectors } from '../selectors/editor'

test('ai panel runs and inserts response @phase5', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await page.getByRole('link', { name: /untitled/i }).click()

  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: 'AI response text' } }],
      }),
    })
  })

  await page.getByRole('button', { name: 'Open AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).toBeVisible()

  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiResponse)).toContainText('AI response text')

  await page.getByRole('button', { name: 'Insert into editor' }).click()
  await expect(page.locator(editorSelectors.contentArea)).toContainText('AI response text')
})
