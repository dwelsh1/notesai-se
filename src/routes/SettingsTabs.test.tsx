import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { SettingsTabs } from './SettingsTabs'
import { ThemeProvider } from '../state/themeContext'
import { PagesProvider } from '../state/pagesContext'
import { SidebarProvider } from '../state/sidebarContext'

function renderSettingsTabs() {
  return render(
    <ThemeProvider>
      <PagesProvider>
        <SidebarProvider>
          <SettingsTabs />
        </SidebarProvider>
      </PagesProvider>
    </ThemeProvider>,
  )
}

describe('SettingsTabs', () => {
  it('renders all tab buttons', () => {
    renderSettingsTabs()

    expect(screen.getByRole('button', { name: 'General Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Templates' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tags' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Data Management' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Diagnostics' })).toBeInTheDocument()
  })

  it('shows General Settings by default', () => {
    renderSettingsTabs()

    expect(screen.getByRole('button', { name: 'General Settings' })).toHaveClass(
      'settings-tabs__tab--active',
    )
  })

  it('switches to AI Settings tab', async () => {
    const user = userEvent.setup()
    renderSettingsTabs()

    const aiTab = screen.getByRole('button', { name: 'AI Settings' })
    await user.click(aiTab)
    await screen.findByTestId('settings-ai-general', {}, { timeout: 1000 }).catch(() => {})

    expect(aiTab).toHaveClass('settings-tabs__tab--active')
    expect(screen.getByRole('button', { name: 'General Settings' })).not.toHaveClass(
      'settings-tabs__tab--active',
    )
  })

  it('switches to Data Management tab', async () => {
    const user = userEvent.setup()
    renderSettingsTabs()

    const dataTab = screen.getByRole('button', { name: 'Data Management' })
    await user.click(dataTab)
    await screen.findByTestId('settings-data-import', {}, { timeout: 1000 }).catch(() => {})

    expect(dataTab).toHaveClass('settings-tabs__tab--active')
    expect(screen.getByRole('button', { name: 'General Settings' })).not.toHaveClass(
      'settings-tabs__tab--active',
    )
  })

  it('shows placeholder for Templates tab', async () => {
    const user = userEvent.setup()
    renderSettingsTabs()

    await user.click(screen.getByRole('button', { name: 'Templates' }))
    await screen.findByText('Templates coming soon', {}, { timeout: 1000 })

    expect(screen.getByText('Templates coming soon')).toBeInTheDocument()
  })
})
