import { test, expect, editPageTitle, gotoSettingsData, waitForSavedAndPageLink } from './fixtures'
import { settingsSelectors, toastSelectors } from '../selectors/settings'

test('import markdown file into pages @data', async ({ page, gotoApp }) => {
  await gotoApp()

  await gotoSettingsData(page)
  await page.locator(settingsSelectors.importTabButton).click()
  await expect(page.locator(settingsSelectors.importCard)).toBeVisible()

  const markdown = '# Imported Page\n\nHello world'
  await page.setInputFiles(settingsSelectors.importFile, {
    name: 'import.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(markdown),
  })

  await expect(page.locator(settingsSelectors.importStatus)).toContainText('imported 1 page')
  await expect(page.locator(toastSelectors.success)).toBeVisible()
  await expect(page.locator(toastSelectors.message)).toContainText(/imported 1 page/i)
  await expect(page.getByTestId('page-list')).toContainText('Imported Page')
})

test('export selected pages and backup @data', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await editPageTitle(page, 'Export Me')
  await page.getByRole('button', { name: 'Save' }).click()
  await waitForSavedAndPageLink(page)

  await gotoSettingsData(page)
  await page.locator(settingsSelectors.exportTabButton).click()

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-format-json').click(),
  ])
  expect(download[0].suggestedFilename()).toContain('notesai-pages')
  await expect(page.getByTestId('toast-success').filter({ hasText: /Export succeeded/i })).toBeVisible()

  // Navigate to Backup sub-tab
  await page.locator(settingsSelectors.backupTabButton).click()
  const backupDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download.*Backup/ }).click(),
  ])
  expect(backupDownload[0].suggestedFilename()).toContain('notesai-backup')
  await expect(page.getByTestId('toast-success').filter({ hasText: /Backup succeeded|Backup created/i })).toBeVisible()
})
