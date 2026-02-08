import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Dashboard } from '../routes/Dashboard'

describe('AppShell', () => {
  it('renders sidebar and dashboard', () => {
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

    expect(screen.getByText('NotesAI SE')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('creates a new page with Ctrl+N', async () => {
    const user = userEvent.setup()
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

    await act(async () => {
      await user.keyboard('{Control>}n{/Control}')
    })

    expect(await screen.findByText('Untitled')).toBeInTheDocument()
  })

  it('focuses the search input with Ctrl+F', async () => {
    const user = userEvent.setup()
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

    await act(async () => {
      await user.keyboard('{Control>}f{/Control}')
    })

    expect(screen.getByTestId('page-search')).toHaveFocus()
  })
})
