import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
  Undo2,
  Redo2,
  ChevronDown,
  Quote,
  Minus,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Check,
  Table as TableIcon,
  Sparkles,
  Save,
} from 'lucide-react'
import { usePages } from '../state/pagesContext'
import { useTabs } from '../state/tabsContext'
import { buildChatPayload } from '../services/aiPrompt'
import { createLmStudioClient } from '../services/aiClient'
import { loadConfig } from '../config/appConfig'
import {
  getModelForUseCase,
  getTemperature,
  getMaxTokens,
  isAiEnabled,
} from '../services/modelSelection'

const slashCommands = [
  { id: 'heading-1', label: 'Heading 1' },
  { id: 'bullet-list', label: 'Bullet List' },
  { id: 'code-block', label: 'Code Block' },
  { id: 'ai-command', label: 'AI Command' },
]

type SlashCommandId = (typeof slashCommands)[number]['id']

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const FONT_SIZES = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '14px' },
  { name: 'Large', value: '18px' },
  { name: 'Extra Large', value: '24px' },
]

const COLOR_OPTIONS = [
  { name: 'Default', value: null, textColor: '#0f172a', bgColor: '#f6f7fb' },
  { name: 'Gray', value: '#6b7280', textColor: '#6b7280', bgColor: '#f3f4f6' },
  { name: 'Brown', value: '#92400e', textColor: '#92400e', bgColor: '#fef3c7' },
  { name: 'Red', value: '#dc2626', textColor: '#dc2626', bgColor: '#fee2e2' },
  { name: 'Orange', value: '#ea580c', textColor: '#ea580c', bgColor: '#ffedd5' },
  { name: 'Yellow', value: '#ca8a04', textColor: '#ca8a04', bgColor: '#fef9c3' },
  { name: 'Green', value: '#16a34a', textColor: '#16a34a', bgColor: '#dcfce7' },
  { name: 'Blue', value: '#2563eb', textColor: '#2563eb', bgColor: '#dbeafe' },
  { name: 'Purple', value: '#9333ea', textColor: '#9333ea', bgColor: '#f3e8ff' },
  { name: 'Pink', value: '#db2777', textColor: '#db2777', bgColor: '#fce7f3' },
]

function ColorDropdown({
  editor,
  type,
}: {
  editor: ReturnType<typeof useEditor>
  type: 'text' | 'highlight'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  if (!editor) return null

  const getCurrentColor = (): string => {
    if (type === 'text') {
      const color = editor.getAttributes('textStyle')?.color
      const option = COLOR_OPTIONS.find((opt) => opt.value === color)
      return option?.name || 'Default'
    } else {
      const color = editor.getAttributes('highlight')?.color
      const option = COLOR_OPTIONS.find((opt) => opt.value === color)
      return option?.name || 'Default'
    }
  }

  const handleColor = (value: string | null) => {
    if (type === 'text') {
      if (value) {
        editor.chain().focus().setColor(value).run()
      } else {
        editor.chain().focus().unsetColor().run()
      }
    } else {
      if (value) {
        editor.chain().focus().toggleHighlight({ color: value }).run()
      } else {
        editor.chain().focus().unsetHighlight().run()
      }
    }
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currentColor = getCurrentColor()
  const currentOption = COLOR_OPTIONS.find((opt) => opt.name === currentColor) || COLOR_OPTIONS[0]

  return (
    <div className="editor-toolbar__dropdown" ref={buttonRef}>
      <button
        type="button"
        className={`editor-toolbar__button ${isOpen ? 'editor-toolbar__button--active' : ''}`}
        title={type === 'text' ? 'Text color' : 'Background color'}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Palette size={18} />
        <div
          className="editor-toolbar__color-preview"
          style={{
            backgroundColor: type === 'text' ? 'transparent' : currentOption.bgColor,
            color: type === 'text' ? currentOption.textColor : currentOption.textColor,
            width: 16,
            height: 16,
            borderRadius: 3,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          A
        </div>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="editor-toolbar__dropdown-menu editor-toolbar__color-menu">
          <div className="editor-toolbar__color-section">
            <div className="editor-toolbar__color-section-title">
              {type === 'text' ? 'Text' : 'Background'}
            </div>
            {COLOR_OPTIONS.map((option) => {
              const isActive =
                (type === 'text'
                  ? editor.getAttributes('textStyle')?.color === option.value
                  : editor.getAttributes('highlight')?.color === option.value) ||
                (option.value === null &&
                  (type === 'text'
                    ? !editor.getAttributes('textStyle')?.color
                    : !editor.getAttributes('highlight')?.color))
              return (
                <button
                  key={option.name}
                  type="button"
                  className={`editor-toolbar__color-item ${isActive ? 'editor-toolbar__color-item--active' : ''}`}
                  onClick={() => handleColor(option.value)}
                >
                  <div
                    className="editor-toolbar__color-swatch"
                    style={{
                      backgroundColor: type === 'text' ? 'transparent' : option.bgColor,
                      color: option.textColor,
                    }}
                  >
                    A
                  </div>
                  <span>{option.name}</span>
                  {isActive && <Check size={14} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FontSizeDropdown({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  if (!editor) return null

  const getCurrentSize = (): string => {
    const fontSize = editor.getAttributes('textStyle')?.fontSize
    const option = FONT_SIZES.find((opt) => opt.value === fontSize)
    return option?.name || 'Normal'
  }

  const handleSize = (value: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: value }).run()
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="editor-toolbar__dropdown" ref={buttonRef}>
      <button
        type="button"
        className={`editor-toolbar__button ${isOpen ? 'editor-toolbar__button--active' : ''}`}
        title="Font size"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Type size={18} />
        <span className="editor-toolbar__button-label">{getCurrentSize()}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="editor-toolbar__dropdown-menu">
          {FONT_SIZES.map((size) => {
            const isActive = editor.getAttributes('textStyle')?.fontSize === size.value
            return (
              <button
                key={size.name}
                type="button"
                className={`editor-toolbar__dropdown-item ${isActive ? 'editor-toolbar__dropdown-item--active' : ''}`}
                onClick={() => handleSize(size.value)}
              >
                <span>{size.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HeadingDropdown({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  if (!editor) return null

  const getCurrentHeading = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
    if (editor.isActive('heading', { level: 4 })) return 'Heading 4'
    if (editor.isActive('heading', { level: 5 })) return 'Heading 5'
    if (editor.isActive('heading', { level: 6 })) return 'Heading 6'
    return 'Paragraph'
  }

  const handleHeading = (level: HeadingLevel | null) => {
    if (level) {
      editor.chain().focus().toggleHeading({ level }).run()
    } else {
      editor.chain().focus().setParagraph().run()
    }
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="editor-toolbar__dropdown" ref={buttonRef}>
      <button
        type="button"
        className={`editor-toolbar__button ${isOpen ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-heading-dropdown"
        title="Text style"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Type size={18} />
        <span className="editor-toolbar__button-label">{getCurrentHeading()}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="editor-toolbar__dropdown-menu">
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('paragraph') ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(null)}
          >
            <Type size={16} />
            <span>Paragraph</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 1 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(1)}
          >
            <Heading1 size={16} />
            <span>Heading 1</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 2 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(2)}
          >
            <Heading2 size={16} />
            <span>Heading 2</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 3 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(3)}
          >
            <Heading3 size={16} />
            <span>Heading 3</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 4 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(4)}
          >
            <Heading4 size={16} />
            <span>Heading 4</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 5 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(5)}
          >
            <Heading5 size={16} />
            <span>Heading 5</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar__dropdown-item ${editor.isActive('heading', { level: 6 }) ? 'editor-toolbar__dropdown-item--active' : ''}`}
            onClick={() => handleHeading(6)}
          >
            <Heading6 size={16} />
            <span>Heading 6</span>
          </button>
        </div>
      )}
    </div>
  )
}

function LinkPopover({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && editor) {
      const href = editor.getAttributes('link').href ?? ''
      setUrl(href)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen, editor])

  if (!editor) return null

  const handleApply = () => {
    const trimmed = url.trim()
    if (trimmed === '') {
      if (editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      }
    } else {
      const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
      editor.chain().focus().setLink({ href }).run()
    }
    setIsOpen(false)
  }

  const handleRemove = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="editor-toolbar__dropdown" ref={wrapperRef}>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('link') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-link"
        aria-pressed={editor.isActive('link')}
        aria-expanded={isOpen}
        title="Insert link"
        onClick={() => setIsOpen((open) => !open)}
      >
        <LinkIcon size={18} />
      </button>
      {isOpen && (
        <div className="editor-toolbar__dropdown-menu editor-toolbar__link-menu" data-testid="link-popover">
          <input
            ref={inputRef}
            type="url"
            className="editor-toolbar__link-input"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="link-url-input"
          />
          <div className="editor-toolbar__link-actions">
            <button type="button" className="editor-toolbar__link-btn" onClick={handleApply} data-testid="link-apply">
              Apply
            </button>
            {editor.isActive('link') && (
              <button type="button" className="editor-toolbar__link-btn" onClick={handleRemove} data-testid="link-remove">
                Remove link
              </button>
            )}
            <button type="button" className="editor-toolbar__link-btn" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TableDropdown({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const inTable = editor?.isActive('table') ?? false

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!editor) return null

  return (
    <div className="editor-toolbar__dropdown" ref={buttonRef}>
      <button
        type="button"
        className={`editor-toolbar__button ${inTable ? 'editor-toolbar__button--active' : ''} ${isOpen ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-table"
        aria-pressed={inTable}
        aria-expanded={isOpen}
        title="Table"
        onClick={() => setIsOpen((open) => !open)}
      >
        <TableIcon size={18} />
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="editor-toolbar__dropdown-menu editor-toolbar__table-menu">
          {!inTable ? (
            <button
              type="button"
              className="editor-toolbar__dropdown-item"
              data-testid="table-insert"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                setIsOpen(false)
              }}
            >
              Insert table (3×3)
            </button>
          ) : (
            <>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().addRowBefore().run(); setIsOpen(false) }}
              >
                Add row above
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().addRowAfter().run(); setIsOpen(false) }}
              >
                Add row below
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().addColumnBefore().run(); setIsOpen(false) }}
              >
                Add column left
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsOpen(false) }}
              >
                Add column right
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().deleteRow().run(); setIsOpen(false) }}
              >
                Delete row
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().deleteColumn().run(); setIsOpen(false) }}
              >
                Delete column
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item"
                onClick={() => { editor.chain().focus().toggleHeaderRow().run(); setIsOpen(false) }}
              >
                Toggle header row
              </button>
              <button
                type="button"
                className="editor-toolbar__dropdown-item editor-toolbar__dropdown-item--danger"
                data-testid="table-delete"
                onClick={() => { editor.chain().focus().deleteTable().run(); setIsOpen(false) }}
              >
                Delete table
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

type EditorToolbarProps = {
  editor: ReturnType<typeof useEditor>
  isAiOpen?: boolean
  setIsAiOpen?: (value: boolean | ((prev: boolean) => boolean)) => void
  onSave?: () => void
  saveStatus?: string
}

function EditorToolbar({ editor, isAiOpen = false, setIsAiOpen, onSave, saveStatus = '' }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="editor-toolbar__group" data-testid="editor-toolbar">
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('bold') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-bold"
        aria-pressed={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('italic') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-italic"
        aria-pressed={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('underline') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-underline"
        aria-pressed={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('strike') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-strikethrough"
        aria-pressed={editor.isActive('strike')}
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={18} />
      </button>
      <div className="editor-toolbar__separator" />
      <HeadingDropdown editor={editor} />
      <FontSizeDropdown editor={editor} />
      <div className="editor-toolbar__separator" />
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('bulletList') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-bullet-list"
        aria-pressed={editor.isActive('bulletList')}
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('orderedList') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-ordered-list"
        aria-pressed={editor.isActive('orderedList')}
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('codeBlock') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-code-block"
        aria-pressed={editor.isActive('codeBlock')}
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code size={18} />
      </button>
      <button
        type="button"
        className={`editor-toolbar__button ${editor.isActive('blockquote') ? 'editor-toolbar__button--active' : ''}`}
        data-testid="toolbar-blockquote"
        aria-pressed={editor.isActive('blockquote')}
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={18} />
      </button>
      <div className="editor-toolbar__separator" />
      <LinkPopover editor={editor} />
      <TableDropdown editor={editor} />
      <button
        type="button"
        className="editor-toolbar__button"
        title="Horizontal rule (type ---)"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={18} />
      </button>
      <button
        type="button"
        className="editor-toolbar__button"
        title="Insert image"
        onClick={() => {
          const url = window.prompt('Enter image URL:')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
      >
        <ImageIcon size={18} />
      </button>
      <ColorDropdown editor={editor} type="text" />
      <ColorDropdown editor={editor} type="highlight" />
      <div className="editor-toolbar__separator" />
      {setIsAiOpen && (
        <button
          type="button"
          className={`editor-toolbar__button editor-ai-toggle ${isAiOpen ? 'editor-toolbar__button--active' : ''}`}
          title={isAiOpen ? 'Close AI panel' : 'Open AI panel'}
          aria-label={isAiOpen ? 'Close AI' : 'Open AI'}
          onClick={() => setIsAiOpen((prev) => !prev)}
          data-testid="editor-ai-toggle"
        >
          <Sparkles size={18} />
        </button>
      )}
      {setIsAiOpen && <div className="editor-toolbar__separator" />}
      <button
        type="button"
        className="editor-toolbar__button"
        title="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={18} />
      </button>
      <button
        type="button"
        className="editor-toolbar__button"
        title="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={18} />
      </button>
      <div className="editor-toolbar__separator" />
      {onSave && (
        <button
          type="button"
          className="editor-toolbar__button editor-save"
          title="Save page"
          aria-label="Save"
          onClick={onSave}
          data-testid="editor-save"
        >
          <Save size={18} />
        </button>
      )}
      {saveStatus && (
        <span className="editor-save__status" data-testid="save-status" role="status">
          {saveStatus}
        </span>
      )}
    </div>
  )
}

export function Editor() {
  const { id } = useParams()
  const { pages, renamePage, updatePageContent } = usePages()
  const { openTab } = useTabs()
  const page = pages.find((item) => item.id === id)
  const [isSlashOpen, setIsSlashOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (id) {
      openTab(id)
    }
  }, [id, openTab])

  // Prepare content with title as first H1 if needed
  const content = useMemo(() => {
    if (!page) return ''
    const pageContent = page.contentMarkdown || ''

    // Check if content already starts with an H1
    if (pageContent.trim().startsWith('<h1>') || pageContent.trim().startsWith('<h1 ')) {
      return pageContent
    }

    // If content is empty or doesn't start with H1, prepend title as H1
    if (!pageContent.trim()) {
      return `<h1>${page.title || 'Untitled'}</h1>`
    }

    // Content exists but no H1 - prepend title as H1
    return `<h1>${page.title || 'Untitled'}</h1>${pageContent}`
  }, [page])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type / for commands',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        HTMLAttributes: { class: 'editor-table' },
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor: current }) => {
      const position = current.state.selection.from
      const previousChar =
        position > 1 ? current.state.doc.textBetween(position - 1, position, '\n') : ''

      // Extract title from first H1 and update page title
      const currentPageId = id
      if (currentPageId && page) {
        // Get the first node in the document
        const firstNode = current.state.doc.firstChild
        if (firstNode && firstNode.type.name === 'heading' && firstNode.attrs.level === 1) {
          const titleText = firstNode.textContent.trim() || 'Untitled'
          // Only update if title changed
          if (titleText !== page.title) {
            renamePage(currentPageId, titleText).catch(console.error)
          }
        }

        // Debounce auto-save to avoid excessive IPC calls
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          // Save as HTML to preserve formatting
          updatePageContent(currentPageId, current.getHTML()).catch(console.error)
        }, 500) // Save 500ms after user stops typing
      }

      // Handle --- for horizontal rule
      const textBefore = current.state.doc.textBetween(Math.max(0, position - 3), position, '\n')
      if (textBefore === '---' && position >= 3) {
        const { from } = current.state.selection
        current
          .chain()
          .deleteRange({ from: from - 3, to: from })
          .setHorizontalRule()
          .run()
        setIsSlashOpen(false)
        return
      }

      if (previousChar === '/') {
        setIsSlashOpen(true)
      } else if (isSlashOpen) {
        setIsSlashOpen(false)
      }
    },
  })

  // Track the last page ID to detect page changes
  const lastPageIdRef = useRef<string | undefined>(undefined)

  // Update editor content when page changes (not when title changes)
  useEffect(() => {
    if (!editor || !page) {
      return
    }

    // Only update editor content when switching to a different page
    // Don't update when just the title changes (that comes FROM the editor, not TO it)
    const isPageChange = lastPageIdRef.current !== page.id
    lastPageIdRef.current = page.id

    if (!isPageChange) {
      return
    }

    // Clear any pending saves when switching pages
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const currentContent = editor.getHTML()
    let pageContent = page.contentMarkdown || ''

    // Ensure content starts with H1 containing the title
    if (!pageContent.trim().startsWith('<h1>') && !pageContent.trim().startsWith('<h1 ')) {
      if (!pageContent.trim()) {
        pageContent = `<h1>${page.title || 'Untitled'}</h1>`
      } else {
        pageContent = `<h1>${page.title || 'Untitled'}</h1>${pageContent}`
      }
    } else {
      // When loading a page, sync the H1 with the page title
      const h1Match = pageContent.match(/^<h1[^>]*>(.*?)<\/h1>/i)
      if (h1Match && h1Match[1] !== page.title) {
        pageContent = pageContent.replace(
          /^<h1[^>]*>.*?<\/h1>/i,
          `<h1>${page.title || 'Untitled'}</h1>`,
        )
      }
    }

    // Only update if content is different to avoid unnecessary updates
    if (currentContent !== pageContent) {
      editor.commands.setContent(pageContent)
    }
  }, [editor, page?.id, page?.contentMarkdown, page?.title])

  // Auto-focus editor when it's ready and page is loaded
  useEffect(() => {
    if (editor && page) {
      // Small delay to ensure editor is fully rendered
      const timer = setTimeout(() => {
        editor.commands.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [editor, page?.id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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

    // Check if AI is enabled
    if (!isAiEnabled()) {
      setAiError('AI features are disabled. Enable them in Settings > AI Settings > General.')
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
        pageContent: editor ? editor.getText() : page.contentMarkdown, // Use getText() for AI as it needs plain text
        selection,
      })

      // Get appropriate model (auto-selects if needed)
      const model = await getModelForUseCase('chat')
      const temperature = getTemperature()
      const maxTokens = getMaxTokens()

      const client = createLmStudioClient({ baseUrl: config.aiEndpoint })
      const result = await client.completeChat({
        model,
        temperature,
        max_tokens: maxTokens,
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

  const handleSavePage = async () => {
    if (!page || !editor) {
      return
    }
    // Extract and update title from first H1 if it exists
    const firstNode = editor.state.doc.firstChild
    if (firstNode && firstNode.type.name === 'heading' && firstNode.attrs.level === 1) {
      const titleText = firstNode.textContent.trim() || 'Untitled'
      if (titleText !== page.title) {
        await renamePage(page.id, titleText)
      }
    }
    // Save as HTML to preserve formatting
    await updatePageContent(page.id, editor.getHTML())
    setSaveStatus('Saved')
    window.setTimeout(() => setSaveStatus(''), 1500)
  }

  if (!page) {
    return (
      <section>
        <p>Loading page...</p>
      </section>
    )
  }

  return (
    <section className="editor-section">
      <div className="editor-toolbar">
        <EditorToolbar
          editor={editor}
          isAiOpen={isAiOpen}
          setIsAiOpen={setIsAiOpen}
          onSave={handleSavePage}
          saveStatus={saveStatus}
        />
      </div>
      {isAiOpen && (
        <div className="ai-panel">
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
              <button type="button" title="Run AI" onClick={handleRunAi} disabled={aiLoading}>
                {aiLoading ? 'Running...' : 'Run AI'}
              </button>
              <button
                type="button"
                title="Insert AI response"
                onClick={handleInsertAi}
                disabled={!aiResponse}
              >
                Insert into editor
              </button>
            </div>
            {aiError && (
              <p data-testid="ai-error" role="alert">
                {aiError}
              </p>
            )}
            {aiResponse && (
              <div data-testid="ai-response" role="status" aria-live="polite">
                <strong>Response</strong>
                <p>{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}
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
                title={command.label}
                data-testid={`slash-command-${command.id}`}
                onClick={() => runSlashCommand(command.id)}
              >
                {command.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
