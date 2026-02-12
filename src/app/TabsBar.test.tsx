import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TabsBar } from './TabsBar'
import { TabsProvider } from '../state/tabsContext'
import { ThemeProvider } from '../state/themeContext'
import { PagesProvider } from '../state/pagesContext'
import type { Page } from '../storage/storage'

const pages: Page[] = [
  {
    id: 'p1',
    title: 'Alpha',
    parentId: null,
    order: 0,
    contentMarkdown: '',
    updatedAt: '2026-02-10T00:00:00.000Z',
    createdAt: '2026-02-10T00:00:00.000Z',
    trashed: false,
    favorited: false,
  },
]

describe('TabsBar', () => {
  it('renders empty state when no tabs', () => {
    render(
      <ThemeProvider>
        <PagesProvider initialPages={pages}>
          <TabsProvider persist={false}>
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <TabsBar />
            </MemoryRouter>
          </TabsProvider>
        </PagesProvider>
      </ThemeProvider>,
    )

    expect(screen.getByTestId('tabs-empty')).toBeInTheDocument()
  })

  it('renders tab labels for open tabs', () => {
    render(
      <ThemeProvider>
        <PagesProvider initialPages={pages}>
          <TabsProvider
            persist={false}
            initialTabs={[
              {
                id: 't1',
                pageId: 'p1',
                pinned: false,
                lastActiveAt: '2026-02-10T00:00:00.000Z',
                order: 0,
              },
            ]}
            initialActiveId="t1"
          >
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <TabsBar />
            </MemoryRouter>
          </TabsProvider>
        </PagesProvider>
      </ThemeProvider>,
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByTestId('tab-t1')).toBeInTheDocument()
  })

  it('prioritizes pinned tabs', () => {
    render(
      <ThemeProvider>
        <PagesProvider
          initialPages={[
            ...pages,
            {
              id: 'p2',
              title: 'Pinned',
              parentId: null,
              order: 1,
              contentMarkdown: '',
              updatedAt: '2026-02-10T00:00:00.000Z',
              createdAt: '2026-02-10T00:00:00.000Z',
              trashed: false,
              favorited: false,
            },
          ]}
        >
          <TabsProvider
            persist={false}
            initialTabs={[
              {
                id: 't1',
                pageId: 'p1',
                pinned: false,
                lastActiveAt: '2026-02-10T00:00:00.000Z',
                order: 0,
              },
              {
                id: 't2',
                pageId: 'p2',
                pinned: true,
                lastActiveAt: '2026-02-10T00:00:00.000Z',
                order: 1,
              },
            ]}
            initialActiveId="t1"
          >
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <TabsBar />
            </MemoryRouter>
          </TabsProvider>
        </PagesProvider>
      </ThemeProvider>,
    )

    const labels = screen.getAllByRole('button', { name: /alpha|pinned/i })
    expect(labels[0]).toHaveTextContent('Pinned')
  })
})
