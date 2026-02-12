import { test, expect, gotoSettingsData } from './fixtures'
import { settingsSelectors } from '../selectors/settings'

test.describe('Settings UI', () => {
  test('displays all main tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()

    // Check all main tabs are visible
    await expect(page.locator(settingsSelectors.generalTab)).toBeVisible()
    await expect(page.locator(settingsSelectors.dataTab)).toBeVisible()
    await expect(page.locator(settingsSelectors.aiTab)).toBeVisible()
    await expect(page.getByTestId('settings-tab-templates')).toBeVisible()
    await expect(page.getByTestId('settings-tab-tags')).toBeVisible()
    await expect(page.getByTestId('settings-tab-diagnostics')).toBeVisible()
  })

  test('switches between main tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()

    // General Settings should be active by default
    await expect(page.locator(settingsSelectors.generalTab)).toHaveClass(
      /settings-tabs__tab--active/,
    )

    // Switch to Data Management
    await page.locator(settingsSelectors.dataTab).click()
    await expect(page.locator(settingsSelectors.dataTab)).toHaveClass(/settings-tabs__tab--active/)
    await expect(page.locator(settingsSelectors.generalTab)).not.toHaveClass(
      /settings-tabs__tab--active/,
    )

    // Switch to AI Settings
    await page.locator(settingsSelectors.aiTab).click()
    await expect(page.locator(settingsSelectors.aiTab)).toHaveClass(/settings-tabs__tab--active/)
  })

  test('Data Management displays sub-tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await gotoSettingsData(page)

    // Check all five sub-tabs are visible
    await expect(page.locator(settingsSelectors.backupTabButton)).toBeVisible()
    await expect(page.locator(settingsSelectors.restoreTabButton)).toBeVisible()
    await expect(page.locator(settingsSelectors.exportTabButton)).toBeVisible()
    await expect(page.locator(settingsSelectors.importTabButton)).toBeVisible()
    await expect(page.locator(settingsSelectors.mediaTabButton)).toBeVisible()

    // Backup should be active by default
    await expect(page.locator(settingsSelectors.backupTabButton)).toHaveClass(
      /settings-data__sub-tab--active/,
    )
  })

  test('switches between Data Management sub-tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await gotoSettingsData(page)
    await expect(page.locator(settingsSelectors.backupCard)).toBeVisible({ timeout: 5000 })

    await page.locator(settingsSelectors.exportTabButton).click()
    await expect(page.locator(settingsSelectors.exportTabButton)).toHaveClass(
      /settings-data__sub-tab--active/,
    )
    await expect(page.locator(settingsSelectors.exportCard)).toBeVisible({ timeout: 5000 })

    await page.locator(settingsSelectors.backupTabButton).click()
    await expect(page.locator(settingsSelectors.backupTabButton)).toHaveClass(
      /settings-data__sub-tab--active/,
    )
    await expect(page.locator(settingsSelectors.backupCard)).toBeVisible({ timeout: 5000 })

    await page.locator(settingsSelectors.importTabButton).click()
    await expect(page.locator(settingsSelectors.importCard)).toBeVisible({ timeout: 5000 })
  })

  test('AI Settings displays sub-tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toBeVisible({ timeout: 5000 })

    // Check all sub-tabs are visible
    await expect(page.locator(settingsSelectors.aiPromptsSubTab)).toBeVisible()

    // General should be active by default
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toHaveClass(
      /settings-ai__sub-tab--active/,
    )
  })

  test('switches between AI Settings sub-tabs @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toHaveClass(
      /settings-ai__sub-tab--active/,
      { timeout: 5000 },
    )

    await page.locator(settingsSelectors.aiPromptsSubTab).click()
    await expect(page.locator(settingsSelectors.aiPromptsSubTab)).toHaveClass(
      /settings-ai__sub-tab--active/,
      { timeout: 5000 },
    )
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).not.toHaveClass(
      /settings-ai__sub-tab--active/,
    )

    await page.locator(settingsSelectors.aiGeneralSubTab).click()
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toHaveClass(
      /settings-ai__sub-tab--active/,
      { timeout: 5000 },
    )
  })

  test('Settings sections have scrollbars when content overflows @settings', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()

    // Check that the content area has overflow-y: auto
    const contentArea = page.locator('.settings-ai__content')
    await expect(contentArea).toBeVisible()

    // Verify scrolling is enabled by checking computed styles
    const overflowY = await contentArea.evaluate((el) => {
      return window.getComputedStyle(el).overflowY
    })
    expect(overflowY).toBe('auto')
  })

  test('AI General shows Enable AI Features, Test Connection, and Save Changes @settings', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    const general = page.locator('[data-testid="settings-ai-general"]')
    await expect(general).toBeVisible({ timeout: 5000 })
    await expect(general.getByText('Enable AI Features')).toBeVisible()
    await expect(general.locator('input[type="checkbox"]')).toBeAttached()
    await expect(general.getByRole('button', { name: 'Test Connection' })).toBeVisible()
    await expect(general.getByRole('button', { name: 'Save Changes' })).toBeVisible()
    await expect(general.getByText(/LM Studio Endpoint/i)).toBeVisible()
  })

  test('AI General Test Connection button is disabled when AI is disabled @settings', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    const general = page.locator('[data-testid="settings-ai-general"]')
    await general.scrollIntoViewIfNeeded()
    await general.locator('.settings-ai__toggle').click()
    await expect(general.getByRole('button', { name: 'Test Connection' })).toBeDisabled()
  })

  test('AI General Test Connection shows status when endpoint is mocked @settings', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()

    await page.route('**/v1/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'test-model' }] }),
      })
    })

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    const general = page.locator('[data-testid="settings-ai-general"]')
    await expect(general).toBeVisible({ timeout: 5000 })
    await general.getByRole('button', { name: 'Test Connection' }).click()

    // Status may appear in multiple elements (e.g. message + model count); match the first
    await expect(page.getByText(/testing|connected|1 model/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('AI Prompts shows command list and prompt editor for selected command @settings', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toBeVisible({ timeout: 5000 })
    await page.locator(settingsSelectors.aiPromptsSubTab).click()
    const prompts = page.locator('[data-testid="settings-ai-prompts"]')
    await expect(prompts).toBeVisible({ timeout: 5000 })
    await expect(prompts.getByPlaceholder('Search commands...')).toBeVisible()
    await expect(prompts.getByRole('button', { name: 'Summarize Selection' })).toBeVisible()

    await prompts.getByRole('button', { name: 'Summarize Selection' }).click()
    await expect(prompts.locator('.settings-ai-prompts__prompt-textarea').first()).toBeVisible()
    await expect(prompts.locator('.settings-ai-prompts__prompt-textarea').nth(1)).toBeVisible()
  })

  test('AI Prompts custom prompt can be edited and saved @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    await page.locator(settingsSelectors.aiTab).click()
    await expect(page.locator(settingsSelectors.aiGeneralSubTab)).toBeVisible({ timeout: 5000 })
    await page.locator(settingsSelectors.aiPromptsSubTab).click()
    const prompts = page.locator('[data-testid="settings-ai-prompts"]')
    await expect(prompts).toBeVisible({ timeout: 5000 })
    await prompts.getByRole('button', { name: 'Summarize Selection' }).click()
    await expect(prompts.locator('.settings-ai-prompts__prompt-textarea').nth(1)).toBeVisible()

    const userPromptArea = prompts.locator('.settings-ai-prompts__prompt-textarea').nth(1)
    await userPromptArea.fill('Custom user prompt for testing.')
    await expect(prompts.getByRole('button', { name: 'Save Changes' })).toBeVisible()
    await prompts.getByRole('button', { name: 'Save Changes' }).click()

    await expect(prompts.getByRole('button', { name: 'Save Changes' })).not.toBeVisible()
    await expect(prompts.getByText('(Custom)')).toBeVisible()
  })

  test('settings theme selection persists @data @settings', async ({ page, gotoApp }) => {
    await gotoApp()

    await page.getByTestId('nav-settings').click()
    // Wait for settings to load
    await page.waitForSelector(settingsSelectors.title, { timeout: 5000 })
    // General Settings tab should be active by default
    await expect(page.locator(settingsSelectors.generalTab)).toHaveClass(/settings-tabs__tab--active/)

    await page.getByRole('radio', { name: 'Dark', exact: true }).check()
    await expect(page.locator('html')).toHaveClass(/theme-dark/)

    await page.reload()
    await page.waitForSelector(settingsSelectors.title, { timeout: 15_000 })
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 5000 })
    await expect(page.locator('html')).toHaveClass(/theme-dark/)
  })
})
