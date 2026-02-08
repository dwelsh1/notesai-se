import { render, screen } from '@testing-library/react'
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
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('NotesAI SE')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
