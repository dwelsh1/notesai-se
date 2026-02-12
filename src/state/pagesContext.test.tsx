import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { PagesProvider, usePages } from './pagesContext'
import type { Page } from '../storage/storage'

const initialPage: Page = {
  id: 'p1',
  title: 'Initial',
  contentMarkdown: '',
  updatedAt: '2026-02-08T00:00:00.000Z',
  createdAt: '2026-02-08T00:00:00.000Z',
  trashed: false,
  favorited: false,
  parentId: null,
  order: 0,
  favoriteOrder: null,
}

function PagesHarness({ incoming }: { incoming: Page[] }) {
  const { pages, addPages, updatePageContent, toggleFavorite, updateFavoriteOrder } = usePages()

  return (
    <div>
      <button type="button" data-testid="add-pages" onClick={() => addPages(incoming)}>
        Add pages
      </button>
      <button
        type="button"
        data-testid="update-content"
        onClick={() => {
          updatePageContent('p1', 'Updated').catch(console.error)
        }}
      >
        Update content
      </button>
      <button
        type="button"
        data-testid="toggle-favorite"
        onClick={() => {
          toggleFavorite('p1').catch(console.error)
        }}
      >
        Toggle favorite
      </button>
      <button
        type="button"
        data-testid="update-favorite-order"
        onClick={() => {
          updateFavoriteOrder('p1', 5).catch(console.error)
        }}
      >
        Update favorite order
      </button>
      <div data-testid="pages-state">{JSON.stringify(pages)}</div>
    </div>
  )
}

describe('PagesProvider', () => {
  it('adds imported pages without duplicating ids', async () => {
    const user = userEvent.setup()
    const incoming: Page[] = [
      initialPage,
      {
        id: 'p2',
        title: 'Imported',
        contentMarkdown: 'Hello',
        updatedAt: '2026-02-08T01:00:00.000Z',
        createdAt: '2026-02-08T01:00:00.000Z',
        trashed: false,
        favorited: false,
        parentId: null,
        order: 1,
        favoriteOrder: null,
      },
    ]

    render(
      <PagesProvider initialPages={[initialPage]}>
        <PagesHarness incoming={incoming} />
      </PagesProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('add-pages'))
    })

    const pages = JSON.parse(screen.getByTestId('pages-state').textContent || '[]') as Page[]
    expect(pages).toHaveLength(2)
    expect(pages.map((page) => page.id)).toEqual(['p1', 'p2'])
  })

  it('updates page content', async () => {
    const user = userEvent.setup()
    render(
      <PagesProvider initialPages={[initialPage]}>
        <PagesHarness incoming={[]} />
      </PagesProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('update-content'))
    })

    const pages = JSON.parse(screen.getByTestId('pages-state').textContent || '[]') as Page[]
    expect(pages[0].contentMarkdown).toBe('Updated')
  })

  it('updates favorite order', async () => {
    const user = userEvent.setup()
    const favoritedPage: Page = {
      ...initialPage,
      favorited: true,
      favoriteOrder: 0,
    }
    render(
      <PagesProvider initialPages={[favoritedPage]}>
        <PagesHarness incoming={[]} />
      </PagesProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('update-favorite-order'))
    })

    const pages = JSON.parse(screen.getByTestId('pages-state').textContent || '[]') as Page[]
    expect(pages[0].favoriteOrder).toBe(5)
  })

  it('sets favoriteOrder when favoriting a page', async () => {
    const user = userEvent.setup()
    render(
      <PagesProvider initialPages={[initialPage]}>
        <PagesHarness incoming={[]} />
      </PagesProvider>,
    )

    await act(async () => {
      await user.click(screen.getByTestId('toggle-favorite'))
    })

    const pages = JSON.parse(screen.getByTestId('pages-state').textContent || '[]') as Page[]
    expect(pages[0].favorited).toBe(true)
    expect(pages[0].favoriteOrder).toBe(0) // First favorite gets order 0
  })
})
