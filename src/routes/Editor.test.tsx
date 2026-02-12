import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PagesProvider } from '../state/pagesContext'
import { TabsProvider } from '../state/tabsContext'
import { Editor } from './Editor'
import type { Page } from '../storage/storage'
import { beforeAll, afterAll, vi } from 'vitest'

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
        <MemoryRouter
          initialEntries={[`/page/${page.id}`]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="page/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      </TabsProvider>
    </PagesProvider>,
  )
}

describe('Editor', () => {
  const originalError = console.error

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('act(')) {
        return
      }
      originalError(message, ...args)
    })
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

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
    expect(screen.getByTestId('toolbar-underline')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-strikethrough')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-heading-dropdown')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-code-block')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-link')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-table')).toBeInTheDocument()
    expect(screen.getByTestId('editor-ai-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('editor-save')).toBeInTheDocument()
  })

  it('opens slash menu when typing /', async () => {
    const user = userEvent.setup()
    renderEditor()

    const editorShell = await screen.findByTestId('editor-content')
    const editor = within(editorShell).getByRole('textbox')
    await user.click(editor)
    await user.type(editor, '/')

    expect(await screen.findByTestId('slash-menu')).toBeInTheDocument()
    expect(screen.getByTestId('slash-command-ai-command')).toBeInTheDocument()
  })

  it('shows AI error when instruction is empty', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(await screen.findByRole('button', { name: /open ai/i }))

    const runButton = await screen.findByRole('button', { name: /run ai/i })
    await user.click(runButton)

    expect(await screen.findByTestId('ai-error')).toBeInTheDocument()
  })
})
