import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { usePages } from '../state/pagesContext'
import { useTabs } from '../state/tabsContext'
import { buildChatPayload } from '../services/aiPrompt'
import { createLmStudioClient } from '../services/aiClient'
import { loadConfig } from '../config/appConfig'

const slashCommands = [
  { id: 'heading-1', label: 'Heading 1' },
  { id: 'bullet-list', label: 'Bullet List' },
  { id: 'code-block', label: 'Code Block' },
  { id: 'ai-command', label: 'AI Command' },
]

type SlashCommandId = (typeof slashCommands)[number]['id']

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      <button
        type="button"
        data-testid="toolbar-bold"
        aria-pressed={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button
        type="button"
        data-testid="toolbar-italic"
        aria-pressed={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button
        type="button"
        data-testid="toolbar-heading"
        aria-pressed={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        data-testid="toolbar-bullet-list"
        aria-pressed={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Bullet List
      </button>
      <button
        type="button"
        data-testid="toolbar-code-block"
        aria-pressed={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        Code Block
      </button>
    </div>
  )
}

export function Editor() {
  const { id } = useParams()
  const { pages } = usePages()
  const { openTab } = useTabs()
  const page = pages.find((item) => item.id === id)
  const [isSlashOpen, setIsSlashOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (id) {
      openTab(id)
    }
  }, [id, openTab])

  const content = useMemo(() => page?.contentMarkdown || 'Type / for commands', [page])

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor: current }) => {
      const text = current.getText()
      if (text.endsWith('/')) {
        setIsSlashOpen(true)
      } else if (isSlashOpen) {
        setIsSlashOpen(false)
      }
    },
  })

  const runSlashCommand = (commandId: SlashCommandId) => {
    if (!editor) return

    const { from } = editor.state.selection
    if (from > 1) {
      editor.commands.deleteRange({ from: from - 1, to: from })
    }

    switch (commandId) {
      case 'heading-1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'bullet-list':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'code-block':
        editor.chain().focus().toggleCodeBlock().run()
        break
      case 'ai-command':
        setIsAiOpen(true)
        break
    }

    setIsSlashOpen(false)
  }

  const handleRunAi = async () => {
    if (!page) {
      return
    }

    const instruction = aiInstruction.trim()
    if (!instruction) {
      setAiError('Enter an instruction for the AI.')
      return
    }

    setAiError('')
    setAiResponse('')
    setAiLoading(true)

    try {
      const selection =
        editor && editor.state.selection.from !== editor.state.selection.to
          ? editor.state.doc.textBetween(
              editor.state.selection.from,
              editor.state.selection.to,
              '\n',
            )
          : undefined

      const config = loadConfig()
      const payload = buildChatPayload({
        instruction,
        pageTitle: page.title,
        pageContent: page.contentMarkdown,
        selection,
      })
      const client = createLmStudioClient({ baseUrl: config.aiEndpoint })
      const result = await client.completeChat({
        model: config.aiModel,
        temperature: config.aiTemperature,
        messages: payload.messages,
      })

      setAiResponse(result.content || '(no response)')
    } catch (error) {
      setAiError((error as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleInsertAi = () => {
    if (editor && aiResponse) {
      editor.chain().focus().insertContent(aiResponse).run()
    }
  }

  return (
    <section>
      <h1>Editor</h1>
      {page ? (
        <>
          <p>Page ID: {page.id}</p>
          <p>Title: {page.title}</p>
          <EditorToolbar editor={editor} />
          <div className="editor-shell">
            <EditorContent
              editor={editor}
              data-testid="editor-content"
              onKeyDown={(event) => {
                if (event.key === '/') {
                  setIsSlashOpen(true)
                }
              }}
            />
            {isSlashOpen && (
              <div className="slash-menu" data-testid="slash-menu">
                {slashCommands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    data-testid={`slash-command-${command.id}`}
                    onClick={() => runSlashCommand(command.id)}
                  >
                    {command.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ai-panel">
            <button type="button" onClick={() => setIsAiOpen((prev) => !prev)}>
              {isAiOpen ? 'Close AI' : 'Open AI'}
            </button>
            {isAiOpen && (
              <div className="ai-panel__body" data-testid="ai-panel">
                <label>
                  Instruction
                  <textarea
                    data-testid="ai-instruction"
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Summarize this page"
                  />
                </label>
                <div className="ai-panel__actions">
                  <button type="button" onClick={handleRunAi} disabled={aiLoading}>
                    {aiLoading ? 'Running...' : 'Run AI'}
                  </button>
                  <button type="button" onClick={handleInsertAi} disabled={!aiResponse}>
                    Insert into editor
                  </button>
                </div>
                {aiError && <p data-testid="ai-error">{aiError}</p>}
                {aiResponse && (
                  <div data-testid="ai-response">
                    <strong>Response</strong>
                    <p>{aiResponse}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <p>Page not found.</p>
      )}
    </section>
  )
}
