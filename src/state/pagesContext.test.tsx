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
}

function PagesHarness({ incoming }: { incoming: Page[] }) {
  const { pages, addPages } = usePages()

  return (
    <div>
      <button type="button" data-testid="add-pages" onClick={() => addPages(incoming)}>
        Add pages
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
})
