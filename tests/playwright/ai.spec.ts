import { test, expect, openNewPage } from './fixtures'
import { editorSelectors } from '../selectors/editor'
import { settingsSelectors } from '../selectors/settings'

async function openEditorWithAiPanel(page: import('@playwright/test').Page, gotoApp: () => Promise<void>) {
  await gotoApp()
  await openNewPage(page)
  await page.getByRole('button', { name: 'Open AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).toBeVisible()
}

test('ai panel runs and inserts response @ai', async ({ page, gotoApp }) => {
  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: 'AI response text' } }],
      }),
    })
  })

  await openEditorWithAiPanel(page, gotoApp)

  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiResponse)).toContainText('AI response text', {
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'Insert into editor' })).toBeEnabled()

  await page.getByRole('button', { name: 'Insert into editor' }).click()
  await expect(page.locator(editorSelectors.contentArea)).toContainText('AI response text')
})

test('ai panel can be opened and closed @ai', async ({ page, gotoApp }) => {
  await gotoApp()
  await openNewPage(page)

  await page.getByRole('button', { name: 'Open AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).toBeVisible()
  await expect(page.locator(editorSelectors.aiInstruction)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run AI' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Insert into editor' })).toBeVisible()

  await page.getByRole('button', { name: 'Close AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).not.toBeVisible()
})

test('run AI with empty instruction shows validation error @ai', async ({ page, gotoApp }) => {
  await openEditorWithAiPanel(page, gotoApp)

  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiError)).toBeVisible()
  await expect(page.locator(editorSelectors.aiError)).toContainText(/enter an instruction/i)
})

test('AI panel shows error when API request fails @ai', async ({ page, gotoApp }) => {
  await openEditorWithAiPanel(page, gotoApp)

  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({ status: 500, body: 'Internal Server Error' })
  })

  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiError)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Insert into editor' })).toBeDisabled()
})

test('Insert into editor is disabled until AI returns a response @ai', async ({ page, gotoApp }) => {
  await openEditorWithAiPanel(page, gotoApp)

  await expect(page.getByRole('button', { name: 'Insert into editor' })).toBeDisabled()

  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: 'Done.' } }],
      }),
    })
  })
  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiResponse)).toContainText('Done.')
  await expect(page.getByRole('button', { name: 'Insert into editor' })).toBeEnabled()
})

test('Run AI when AI disabled in Settings shows disabled message @ai', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('nav-settings').click()
  await page.locator(settingsSelectors.aiTab).click()
  const generalSection = page.locator('[data-testid="settings-ai-general"]')
  await expect(generalSection).toBeVisible({ timeout: 5000 })
  await generalSection.scrollIntoViewIfNeeded()
  await generalSection.locator('.settings-ai__toggle').click()
  await generalSection.getByRole('button', { name: 'Save Changes' }).click()

  await page.getByTestId('nav-home').click()
  await openNewPage(page)
  await page.getByRole('button', { name: 'Open AI' }).click()
  await expect(page.locator(editorSelectors.aiPanel)).toBeVisible()
  await page.locator(editorSelectors.aiInstruction).fill('Summarize this page.')
  await page.getByRole('button', { name: 'Run AI' }).click()

  await expect(page.locator(editorSelectors.aiError)).toBeVisible()
  await expect(page.locator(editorSelectors.aiError)).toContainText(
    /AI features are disabled.*Settings.*AI Settings.*General/i,
  )
})
