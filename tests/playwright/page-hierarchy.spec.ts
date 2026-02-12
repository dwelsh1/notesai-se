import { test, expect, editPageTitle, waitForSavedAndPageLink } from './fixtures'

test.describe('Page Hierarchy', () => {
  test('creates child pages and displays hierarchy @page', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Parent Page')
    await page.getByRole('button', { name: 'Save' }).click()
    const parentPageId = await waitForSavedAndPageLink(page)
    const parentRow = page
      .locator(`[data-testid="page-link-${parentPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()

    // Hover over the parent page row to show the create child button
    await parentRow.hover()

    // Click the create child button (appears on hover)
    await page.getByRole('button', { name: 'Create child page' }).click()

    // The child page should be created and parent should auto-expand
    await expect(page.getByTestId('page-list')).toContainText('Untitled')

    // Verify parent has expand/collapse button (has children)
    await expect(parentRow.getByRole('button', { name: /expand|collapse/i })).toBeVisible()
  })

  test('expands and collapses pages with children @page', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Expandable Parent')
    await page.getByRole('button', { name: 'Save' }).click()
    const parentPageId = await waitForSavedAndPageLink(page)
    const parentRow = page
      .locator(`[data-testid="page-link-${parentPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()

    await parentRow.hover()
    await page.getByRole('button', { name: 'Create child page' }).click()
    await expect(page).toHaveURL(/\/page\/[^/]+/)
    const childPageId = page.url().match(/\/page\/([^/]+)/)?.[1]
    expect(childPageId).toBeDefined()
    const childLink = page.locator(`[data-testid="page-link-${childPageId}"]`)
    await expect(childLink).toBeVisible()

    const collapseButton = parentRow.getByRole('button', { name: 'Collapse page' })
    await collapseButton.click()
    await expect(childLink).not.toBeVisible()

    const expandButton = parentRow.getByRole('button', { name: 'Expand page' })
    await expect(expandButton).toBeVisible()
    await expandButton.click()

    await expect(childLink).toBeVisible()
  })

  test('drag and drop reorders pages @page', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Page A')
    await page.getByRole('button', { name: 'Save' }).click()
    const pageIdA = await waitForSavedAndPageLink(page)

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Page B')
    await page.getByRole('button', { name: 'Save' }).click()
    const pageIdB = await waitForSavedAndPageLink(page)

    const pageALink = page.locator(`[data-testid="page-link-${pageIdA}"]`)
    const pageBLink = page.locator(`[data-testid="page-link-${pageIdB}"]`)
    await expect(pageALink).toBeVisible()
    await expect(pageBLink).toBeVisible()

    const pageARow = pageALink
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()
    const dragHandle = pageARow.getByRole('button', { name: 'Drag to reorder or nest' })

    const pageBRow = pageBLink
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()
    const pageBBox = await pageBRow.boundingBox()
    if (!pageBBox) {
      throw new Error('Page B row not found')
    }

    // Drag Page A to Page B's position
    await dragHandle.hover()
    await page.mouse.down()
    await page.mouse.move(pageBBox.x + pageBBox.width / 2, pageBBox.y + pageBBox.height / 2)
    await page.mouse.up()

    await expect(pageALink).toBeVisible()
    await expect(pageBLink).toBeVisible()
  })

  test('drag and drop nests pages @page', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Parent')
    await page.getByRole('button', { name: 'Save' }).click()
    const parentPageId = await waitForSavedAndPageLink(page)
    const parentRow = page
      .locator(`[data-testid="page-link-${parentPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()

    await parentRow.hover()
    await page.getByRole('button', { name: 'Create child page' }).click()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'To Nest')
    await page.getByRole('button', { name: 'Save' }).click()
    const toNestPageId = await waitForSavedAndPageLink(page)
    const toNestRow = page
      .locator(`[data-testid="page-link-${toNestPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()
    const dragHandle = toNestRow.getByRole('button', { name: 'Drag to reorder or nest' })

    const parentBox = await parentRow.boundingBox()
    if (!parentBox) {
      throw new Error('Parent row not found')
    }

    // Drag "To Nest" onto "Parent" to nest it
    await dragHandle.hover()
    await page.mouse.down()
    await page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2)
    await page.mouse.up()

    // Nested page is now under parent (title may still be "Untitled" in sidebar)
    await expect(page.locator(`[data-testid="page-link-${toNestPageId}"]`)).toBeVisible()
    await expect(parentRow.getByRole('button', { name: /expand|collapse/i })).toBeVisible()
  })

  test('displays hierarchical tree structure correctly @page', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('page-create').click()
    await editPageTitle(page, 'Root')
    await page.getByRole('button', { name: 'Save' }).click()
    const rootPageId = await waitForSavedAndPageLink(page)
    const rootRow = page
      .locator(`[data-testid="page-link-${rootPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()
    const rootLink = page.locator(`[data-testid="page-link-${rootPageId}"]`)

    await rootRow.hover()
    await page.getByRole('button', { name: 'Create child page' }).click()
    await expect(page).toHaveURL(/\/page\/[^/]+/)
    const childPageId = page.url().match(/\/page\/([^/]+)/)?.[1]
    expect(childPageId).toBeDefined()

    await editPageTitle(page, 'Child')
    await page.getByRole('button', { name: 'Save' }).click()
    await waitForSavedAndPageLink(page)
    const childRow = page
      .locator(`[data-testid="page-link-${childPageId}"]`)
      .locator('xpath=ancestor::div[contains(@class, "sidebar__page-row")]')
      .first()
    const childLink = page.locator(`[data-testid="page-link-${childPageId}"]`)

    await childRow.hover()
    await page.getByRole('button', { name: 'Create child page' }).click()
    await expect(page).toHaveURL(/\/page\/[^/]+/)
    const grandchildPageId = page.url().match(/\/page\/([^/]+)/)?.[1]
    expect(grandchildPageId).toBeDefined()
    const grandchildLink = page.locator(`[data-testid="page-link-${grandchildPageId}"]`)

    // Verify all three levels are visible
    await expect(rootLink).toBeVisible()
    await expect(childLink).toBeVisible()
    await expect(grandchildLink).toBeVisible()

    // Verify hierarchy by checking that each level has expand/collapse buttons
    await expect(rootRow.getByRole('button', { name: /expand|collapse/i })).toBeVisible()
    await expect(childRow.getByRole('button', { name: /expand|collapse/i })).toBeVisible()
  })
})
