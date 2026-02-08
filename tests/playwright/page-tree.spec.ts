import { test, expect } from './fixtures'

test('page tree supports create, rename, favorite, trash, restore @phase1', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await expect(page.getByTestId('page-list')).toContainText('Untitled')

  await page.getByRole('button', { name: 'Rename page' }).click()
  const titleInput = page.getByTestId('page-title-input')
  await titleInput.fill('Project Alpha')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('page-list')).toContainText('Project Alpha')

  await page.getByRole('button', { name: 'Toggle favorite' }).click()
  await expect(page.getByTestId('favorites-section')).toBeVisible()
  await expect(page.getByTestId('favorites-list')).toContainText('Project Alpha')

  await page.getByRole('button', { name: 'Trash page' }).click()
  await expect(page.getByTestId('trash-section')).toBeVisible()
  await expect(page.getByTestId('trash-list')).toContainText('Project Alpha')

  await page.getByRole('button', { name: 'Restore page' }).click()
  await expect(page.getByTestId('page-list')).toContainText('Project Alpha')
})

test('page tree search filters pages @phase1', async ({ page, gotoApp }) => {
  await gotoApp()

  await page.getByTestId('page-create').click()
  await page.getByRole('button', { name: 'Rename page' }).click()
  await page.getByTestId('page-title-input').fill('Alpha')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.getByTestId('page-create').click()
  await page.getByRole('button', { name: 'Rename page' }).nth(1).click()
  await page.getByTestId('page-title-input').fill('Beta')
  await page.getByRole('button', { name: 'Save' }).click()

  await page.getByTestId('page-search').fill('alp')

  const list = page.getByTestId('page-list')
  await expect(list).toContainText('Alpha')
  await expect(list).not.toContainText('Beta')
})
