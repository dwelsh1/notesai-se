import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider, useTheme } from './themeContext'
import { defaultConfig, loadConfig } from '../config/appConfig'

function ThemeHarness() {
  const { theme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        Light
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('toggles theme and updates html class', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent(defaultConfig.theme)
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /toggle/i }))
    })
    expect(document.documentElement.classList.contains('theme-dark')).toBe(
      loadConfig().theme === 'dark',
    )
  })

  it('sets light theme explicitly', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    )

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /light/i }))
    })
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false)
  })
})
