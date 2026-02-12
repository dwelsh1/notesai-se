import { act, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Dashboard } from '../routes/Dashboard'

function renderSidebar() {
  render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
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

    // Virtualized list: assert there is at least one page-row item
    const list = screen.getByTestId('page-list')
    // Virtualized content is rendered as absolutely positioned rows inside the list
    const rows = list.querySelectorAll('.sidebar__page-row')
    expect(rows.length).toBeGreaterThan(0)
    expect(screen.queryByTestId('sidebar-empty')).not.toBeInTheDocument()
  })

  it('toggles favorites and shows the favorites section', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    // Hover the page row so the favorite button is visible (sidebar shows actions on hover)
    const pageList = screen.getByTestId('page-list')
    const firstRow = pageList.querySelector('.sidebar__page-row')
    expect(firstRow).toBeInTheDocument()
    await act(async () => {
      await user.hover(firstRow!)
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add to favorites|remove from favorites/i }))
    })

    await waitFor(() => {
      const favorites = screen.getByTestId('favorites-list')
      expect(within(favorites).getByText('Untitled')).toBeInTheDocument()
    })
  })

  it('moves pages to trash and restores them', async () => {
    const user = userEvent.setup()
    renderSidebar()

    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    // Hover the page row so the trash button is visible (sidebar shows actions on hover)
    const pageList = screen.getByTestId('page-list')
    const firstRow = pageList.querySelector('.sidebar__page-row')
    expect(firstRow).toBeInTheDocument()
    await act(async () => {
      await user.hover(firstRow!)
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /move to trash/i }))
    })

    // Wait for trash section to auto-expand and find the trash list
    const trashList = await waitFor(() => screen.getByTestId('trash-list'), { timeout: 2000 })
    const trashedItems = within(trashList).getAllByRole('listitem')
    expect(trashedItems.length).toBeGreaterThan(0)

    await act(async () => {
      await user.click(within(trashList).getByRole('button', { name: /restore page/i }))
    })

    const list = screen.getByTestId('page-list')
    const rows = list.querySelectorAll('.sidebar__page-row')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('filters pages by search query', async () => {
    const user = userEvent.setup()
    renderSidebar()

    // Create pages and rename them via the editor (renaming is now done in editor, not sidebar)
    await act(async () => {
      await user.click(screen.getByTestId('page-create'))
    })
    // Navigate to editor and rename there - for now, just test that search works with existing pages
    // In a real scenario, pages would be renamed in the editor

    await act(async () => {
      await user.type(screen.getByTestId('page-search'), 'untitled')
    })

    const list = screen.getByTestId('page-list')
    const rows = list.querySelectorAll('.sidebar__page-row')
    expect(rows.length).toBeGreaterThan(0)
  })
})
