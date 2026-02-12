import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SettingsDataManagement } from './SettingsDataManagement'

vi.mock('./SettingsDataBackup', () => ({
  SettingsDataBackup: () => <div data-testid="settings-data-backup">Backup</div>,
}))
vi.mock('./SettingsDataRestore', () => ({
  SettingsDataRestore: () => <div data-testid="settings-data-restore">Restore</div>,
}))
vi.mock('./SettingsDataExport', () => ({
  SettingsDataExport: () => <div data-testid="settings-data-export">Export</div>,
}))
vi.mock('./SettingsDataImport', () => ({
  SettingsDataImport: () => <div data-testid="settings-data-import">Import</div>,
}))
vi.mock('./SettingsDataMedia', () => ({
  SettingsDataMedia: () => <div data-testid="settings-data-media">Media</div>,
}))

describe('SettingsDataManagement', () => {
  it('renders Data Management title and subtitle', () => {
    render(<SettingsDataManagement />)
    expect(screen.getByText('Data Management')).toBeInTheDocument()
    expect(
      screen.getByText('Export and import your pages and settings. Manage media files.'),
    ).toBeInTheDocument()
  })

  it('renders all five sub-tab buttons', () => {
    render(<SettingsDataManagement />)
    expect(screen.getByTestId('backup-tab-button')).toBeInTheDocument()
    expect(screen.getByTestId('restore-tab-button')).toBeInTheDocument()
    expect(screen.getByTestId('export-tab-button')).toBeInTheDocument()
    expect(screen.getByTestId('import-tab-button')).toBeInTheDocument()
    expect(screen.getByTestId('media-tab-button')).toBeInTheDocument()
  })

  it('shows Backup sub-tab by default', () => {
    render(<SettingsDataManagement />)
    expect(screen.getByTestId('backup-tab-button')).toHaveClass('settings-data__sub-tab--active')
    expect(screen.getByTestId('settings-data-backup')).toBeInTheDocument()
  })

  it('switches to Restore sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsDataManagement />)
    await user.click(screen.getByTestId('restore-tab-button'))
    expect(screen.getByTestId('restore-tab-button')).toHaveClass('settings-data__sub-tab--active')
    expect(screen.getByTestId('settings-data-restore')).toBeInTheDocument()
  })

  it('switches to Export sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsDataManagement />)
    await user.click(screen.getByTestId('export-tab-button'))
    expect(screen.getByTestId('settings-data-export')).toBeInTheDocument()
  })

  it('switches to Import sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsDataManagement />)
    await user.click(screen.getByTestId('import-tab-button'))
    expect(screen.getByTestId('settings-data-import')).toBeInTheDocument()
  })

  it('switches to Media sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsDataManagement />)
    await user.click(screen.getByTestId('media-tab-button'))
    expect(screen.getByTestId('settings-data-media')).toBeInTheDocument()
  })
})
