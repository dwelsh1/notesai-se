import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { usePages } from '../state/pagesContext'

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
  const page = pages.find((item) => item.id === id)
  const [isSlashOpen, setIsSlashOpen] = useState(false)

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
        editor.chain().focus().insertContent('AI: ').run()
        break
    }

    setIsSlashOpen(false)
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
        </>
      ) : (
        <p>Page not found.</p>
      )}
    </section>
  )
}
