import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Dashboard } from './Dashboard'
import { PagesProvider } from '../state/pagesContext'
import { TabsProvider } from '../state/tabsContext'
import type { Page } from '../storage/storage'

const pages: Page[] = [
  {
    id: 'p1',
    title: 'First',
    parentId: null,
    order: 0,
    contentMarkdown: '',
    updatedAt: '2026-02-08T10:00:00.000Z',
    createdAt: '2026-02-08T10:00:00.000Z',
    trashed: false,
    favorited: false,
  },
  {
    id: 'p2',
    title: 'Second',
    parentId: null,
    order: 1,
    contentMarkdown: '',
    updatedAt: '2026-02-08T12:00:00.000Z',
    createdAt: '2026-02-08T12:00:00.000Z',
    trashed: false,
    favorited: true,
  },
  {
    id: 'p3',
    title: 'Trashed',
    parentId: null,
    order: 2,
    contentMarkdown: '',
    updatedAt: '2026-02-08T09:00:00.000Z',
    createdAt: '2026-02-08T09:00:00.000Z',
    trashed: true,
    favorited: false,
  },
]

describe('Dashboard', () => {
  it('shows recent, favorites, and stats', () => {
    render(
      <PagesProvider initialPages={pages}>
        <TabsProvider
          initialTabs={[
            {
              id: 't1',
              pageId: 'p1',
              pinned: false,
              lastActiveAt: '2026-02-08T10:00:00.000Z',
              order: 0,
            },
          ]}
          initialActiveId="t1"
          persist={false}
        >
          <Dashboard />
        </TabsProvider>
      </PagesProvider>,
    )

    expect(screen.getByTestId('dashboard-stats')).toHaveTextContent('Total pages: 3')
    expect(screen.getByTestId('dashboard-stats')).toHaveTextContent('Favorites: 1')
    expect(screen.getByTestId('dashboard-stats')).toHaveTextContent('Trashed: 1')
    expect(screen.getByTestId('dashboard-stats')).toHaveTextContent('Open tabs: 1')

    const recent = screen.getByTestId('dashboard-recent')
    expect(recent).toHaveTextContent('Second')
    expect(recent).toHaveTextContent('First')
    expect(recent).not.toHaveTextContent('Trashed')

    const favorites = screen.getByTestId('dashboard-favorites')
    expect(favorites).toHaveTextContent('Second')
    expect(favorites).not.toHaveTextContent('First')
  })
})
