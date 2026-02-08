import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Dashboard } from '../routes/Dashboard'

function renderSidebar() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="page/:id" element={<div>Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Sidebar page tree', () => {
  it('creates a page from the sidebar', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })

    expect(await screen.findByText('Untitled')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-empty')).not.toBeInTheDocument()
  })

  it('renames a page', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /rename page/i }))
    })

    const input = screen.getByTestId('page-title-input')
    await act(async () => {
      await user.clear(input)
      await user.type(input, 'Project Notes')
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }))
    })

    expect(screen.getByText('Project Notes')).toBeInTheDocument()
  })

  it('toggles favorites and shows the favorites section', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /toggle favorite/i }))
    })

    const favorites = screen.getByTestId('favorites-list')
    expect(within(favorites).getByText('Untitled')).toBeInTheDocument()
  })

  it('moves pages to trash and restores them', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /trash page/i }))
    })

    const trashList = screen.getByTestId('trash-list')
    expect(within(trashList).getByText('Untitled')).toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /restore page/i }))
    })

    expect(screen.getByTestId('page-list')).toHaveTextContent('Untitled')
  })

  it('filters pages by search query', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /rename page/i }))
    })
    await act(async () => {
      await user.clear(screen.getByTestId('page-title-input'))
      await user.type(screen.getByTestId('page-title-input'), 'Alpha')
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }))
    })

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: /rename page/i })[1])
    })
    await act(async () => {
      await user.clear(screen.getByTestId('page-title-input'))
      await user.type(screen.getByTestId('page-title-input'), 'Beta')
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }))
    })

    await act(async () => {
      await user.type(screen.getByTestId('page-search'), 'alp')
    })

    const list = screen.getByTestId('page-list')
    expect(within(list).getByText('Alpha')).toBeInTheDocument()
    expect(within(list).queryByText('Beta')).not.toBeInTheDocument()
  })
})
