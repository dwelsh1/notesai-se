import { test, expect } from './fixtures'
import { settingsSelectors } from '../selectors/settings'

test('import markdown file into pages @phase4', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByRole('link', { name: /settings/i }).click()
  await expect(page.locator(settingsSelectors.importCard)).toBeVisible()

  const markdown = '# Imported Page\n\nHello world'
  await page.setInputFiles(settingsSelectors.importFile, {
    name: 'import.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(markdown),
  })

  await expect(page.locator(settingsSelectors.importStatus)).toContainText('Imported 1 page')
  await expect(page.getByTestId('page-list')).toContainText('Imported Page')
})

test('export selected pages and backup @phase4', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await page.getByRole('button', { name: 'Rename page' }).click()
  await page.getByTestId('page-title-input').fill('Export Me')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.getByRole('link', { name: /settings/i }).click()

  await page.getByLabel('Export Me').check()

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ])
  expect(download[0].suggestedFilename()).toContain('notesai-pages')

  const backupDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export Backup/i }).click(),
  ])
  expect(backupDownload[0].suggestedFilename()).toContain('notesai-backup')
})
