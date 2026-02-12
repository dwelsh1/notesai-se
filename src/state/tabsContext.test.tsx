import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { TabsProvider, useTabs } from './tabsContext'

function TabsHarness() {
  const { tabs, activeTabId, openTab, closeTab, togglePin, reorderTab, setActiveTab } = useTabs()

  return (
    <div>
      <button type="button" onClick={() => openTab('p1')} data-testid="open-p1">
        Open P1
      </button>
      <button type="button" onClick={() => openTab('p2')} data-testid="open-p2">
        Open P2
      </button>
      <button
        type="button"
        onClick={() => {
          if (tabs[0]) {
            togglePin(tabs[0].id)
          }
        }}
        data-testid="pin-first"
      >
        Pin First
      </button>
      <button
        type="button"
        onClick={() => {
          if (tabs[0]) {
            closeTab(tabs[0].id)
          }
        }}
        data-testid="close-first"
      >
        Close First
      </button>
      <button
        type="button"
        onClick={() => {
          if (tabs[1]) {
            setActiveTab(tabs[1].id)
          }
        }}
        data-testid="activate-second"
      >
        Activate Second
      </button>
      <button
        type="button"
        onClick={() => {
          if (tabs[0]) {
            reorderTab(tabs[0].id, 1)
          }
        }}
        data-testid="move-first"
      >
        Move First
      </button>
      <div data-testid="tabs-state">{JSON.stringify({ tabs, activeTabId })}</div>
    </div>
  )
}

function readState() {
  const text = screen.getByTestId('tabs-state').textContent || '{}'
  return JSON.parse(text) as {
    tabs: Array<{ id: string; pageId: string; pinned: boolean }>
    activeTabId: string | null
  }
}

describe('TabsProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens tabs and reuses existing page tabs', async () => {
    const user = userEvent.setup()
    render(
      <TabsProvider>
        <TabsHarness />
      </TabsProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('open-p1'))
    })

    let state = readState()
    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0].pageId).toBe('p1')
    expect(state.activeTabId).toBe(state.tabs[0].id)

    await act(async () => {
      await user.click(screen.getByTestId('open-p1'))
    })

    state = readState()
    expect(state.tabs).toHaveLength(1)
  })

  it('pins, reorders, and closes tabs', async () => {
    const user = userEvent.setup()
    render(
      <TabsProvider>
        <TabsHarness />
      </TabsProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('open-p1'))
      await user.click(screen.getByTestId('open-p2'))
    })

    await act(async () => {
      await user.click(screen.getByTestId('pin-first'))
    })

    let state = readState()
    expect(state.tabs[0].pinned).toBe(true)

    await act(async () => {
      await user.click(screen.getByTestId('move-first'))
    })

    state = readState()
    expect(state.tabs[1].pageId).toBe('p1')

    await act(async () => {
      await user.click(screen.getByTestId('activate-second'))
      await user.click(screen.getByTestId('close-first'))
    })

    state = readState()
    expect(state.tabs).toHaveLength(1)
  })

  it('restores session from localStorage', () => {
    localStorage.setItem(
      'notesai.tabs',
      JSON.stringify({
        tabs: [
          {
            id: 't1',
            pageId: 'p1',
            pinned: false,
            lastActiveAt: '2026-02-08T00:00:00.000Z',
            order: 0,
          },
        ],
        activeTabId: 't1',
      }),
    )

    render(
      <TabsProvider>
        <TabsHarness />
      </TabsProvider>,
    )

    const state = readState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe('t1')
  })
})
