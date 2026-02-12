import { useEffect } from 'react'
import { X } from 'lucide-react'

type AboutModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="about-modal-backdrop">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="about-modal">
        <div className="modal-header">
          <h2>About NotesAI SE</h2>
          <button
            type="button"
            className="modal-close"
            title="Close"
            onClick={onClose}
            aria-label="Close about modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            <strong>NotesAI SE</strong>
          </p>
          <p>Version 0.2.0</p>
          <p>A simplified, local-only NotesAI variant focused on privacy.</p>
          <p>
            Built with Electron, React, TypeScript, Vite, tiptap, SQLite, and LM Studio integration.
          </p>
          <p>
            <a
              href="https://github.com/dwelsh1/notesai-se"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
