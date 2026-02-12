import { useState } from 'react'
import { Search } from 'lucide-react'

export function SettingsDataMedia() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checking, setChecking] = useState(false)

  const handleCheckOrphaned = () => {
    setChecking(true)
    setMessage(null)
    setTimeout(() => {
      setChecking(false)
      setMessage({
        type: 'success',
        text: 'No local media storage configured. Orphaned media check applies when media files are stored in app data.',
      })
    }, 500)
  }

  return (
    <div className="settings-data-media" data-testid="settings-media">
      <section className="settings-section data-management-section">
        <h3 className="data-management-section__title">Media Management</h3>
        <p className="data-management-section__desc">
          Orphaned media (images, videos, files) are files that are not used in any page. Deleting them will free up storage space.
        </p>
        <button
          type="button"
          className="settings-button settings-button--primary"
          disabled={checking}
          onClick={handleCheckOrphaned}
          data-testid="media-check-orphaned"
        >
          <Search size={18} aria-hidden />
          Check for Orphaned Media
        </button>
      </section>
      {message && (
        <p
          className={message.type === 'success' ? 'data-management-message--success' : 'data-management-message--error'}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
