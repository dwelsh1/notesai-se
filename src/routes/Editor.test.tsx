import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PagesProvider } from '../state/pagesContext'
import { TabsProvider } from '../state/tabsContext'
import { Editor } from './Editor'
import type { Page } from '../storage/storage'

const page: Page = {
  id: 'page-1',
  title: 'Test Page',
  parentId: null,
  order: 0,
  contentMarkdown: '# Hello',
  updatedAt: '2026-02-08T00:00:00.000Z',
  createdAt: '2026-02-08T00:00:00.000Z',
  trashed: false,
  favorited: false,
}

function renderEditor() {
  render(
    <PagesProvider initialPages={[page]}>
      <TabsProvider persist={false}>
        <MemoryRouter initialEntries={[`/page/${page.id}`]}>
          <Routes>
            <Route path="page/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      </TabsProvider>
    </PagesProvider>,
  )
}

describe('Editor', () => {
  it('renders markdown content', async () => {
    renderEditor()

    const editor = await screen.findByTestId('editor-content')
    await waitFor(() => {
      expect(editor).toHaveTextContent('Hello')
    })
  })

  it('shows toolbar buttons', async () => {
    renderEditor()

    expect(await screen.findByTestId('toolbar-bold')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-heading')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-code-block')).toBeInTheDocument()
  })

  it('opens slash menu when typing /', async () => {
    const user = userEvent.setup()
    renderEditor()

    const editor = await screen.findByRole('textbox')
    await act(async () => {
      await user.click(editor)
      await user.type(editor, '/')
    })

    expect(await screen.findByTestId('slash-menu')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-ai-command')).toBeInTheDocument()
  })
})
