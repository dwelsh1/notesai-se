import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SemanticSearchModal } from './SemanticSearchModal'
import type { Page } from '../storage/storage'

const mockPages: Page[] = [
  {
    id: 'p1',
    title: 'Test Page',
    contentMarkdown: '<p>Content</p>',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    trashed: false,
    favorited: false,
    parentId: null,
    order: 0,
    favoriteOrder: null,
  },
]

vi.mock('../state/pagesContext', () => ({
  usePages: () => ({ pages: mockPages }),
}))

vi.mock('../services/semanticSearchService', () => ({
  isSemanticSearchAvailable: vi.fn(() => Promise.resolve(true)),
  searchPages: vi.fn(() =>
    Promise.resolve([
      {
        pageId: 'p1',
        title: 'Test Page',
        subtitle: '',
        similarity: 0.85,
        preview: 'Content',
      },
    ]),
  ),
}))

describe('SemanticSearchModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(
      <MemoryRouter>
        <SemanticSearchModal isOpen={false} onClose={onClose} />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('semantic-search-modal')).not.toBeInTheDocument()
  })

  it('renders header, input, and footer when open', async () => {
    render(
      <MemoryRouter>
        <SemanticSearchModal isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    )
    await screen.findByTestId('semantic-search-modal')
    expect(screen.getByText('Semantic Search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by meaning…')).toBeInTheDocument()
    expect(screen.getByText(/↑↓ Navigate/)).toBeInTheDocument()
  })

  it('shows idle state when open and no query', async () => {
    render(
      <MemoryRouter>
        <SemanticSearchModal isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    )
    await screen.findByTestId('semantic-search-idle')
    expect(screen.getByText('Search by Meaning')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SemanticSearchModal isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    )
    await screen.findByTestId('semantic-search-modal')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Close' }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
