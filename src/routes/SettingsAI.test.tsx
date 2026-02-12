import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SettingsAI } from './SettingsAI'

// Mock the child components to avoid complex dependencies
vi.mock('./SettingsAIGeneral', () => ({
  SettingsAIGeneral: () => <div data-testid="settings-ai-general">AI General Settings</div>,
}))

vi.mock('./SettingsAIPrompts', () => ({
  SettingsAIPrompts: () => <div data-testid="settings-ai-prompts">AI Prompts Settings</div>,
}))

describe('SettingsAI', () => {
  it('renders sub-tab buttons', () => {
    render(<SettingsAI />)

    expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prompts' })).toBeInTheDocument()
  })

  it('shows General sub-tab by default', () => {
    render(<SettingsAI />)

    expect(screen.getByRole('button', { name: 'General' })).toHaveClass(
      'settings-ai__sub-tab--active',
    )
    expect(screen.getByTestId('settings-ai-general')).toBeInTheDocument()
  })

  it('switches to Prompts sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsAI />)

    const promptsTab = screen.getByRole('button', { name: 'Prompts' })
    await user.click(promptsTab)

    expect(promptsTab).toHaveClass('settings-ai__sub-tab--active')
    expect(screen.getByRole('button', { name: 'General' })).not.toHaveClass(
      'settings-ai__sub-tab--active',
    )
    expect(screen.getByTestId('settings-ai-prompts')).toBeInTheDocument()
  })

  it('switches back to General sub-tab', async () => {
    const user = userEvent.setup()
    render(<SettingsAI />)

    // Switch to Prompts first
    await user.click(screen.getByRole('button', { name: 'Prompts' }))

    // Switch back to General
    const generalTab = screen.getByRole('button', { name: 'General' })
    await user.click(generalTab)

    expect(generalTab).toHaveClass('settings-ai__sub-tab--active')
    expect(screen.getByTestId('settings-ai-general')).toBeInTheDocument()
  })
})
