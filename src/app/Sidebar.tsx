import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePages } from '../state/pagesContext'

type PageRowProps = {
  id: string
  title: string
  favorited: boolean
  onRename: (id: string, title: string) => void
  onToggleFavorite: (id: string) => void
  onTrash: (id: string) => void
}

function PageRow({ id, title, favorited, onRename, onToggleFavorite, onTrash }: PageRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)

  useEffect(() => {
    setDraftTitle(title)
  }, [title])

  const handleSave = () => {
    onRename(id, draftTitle)
    setIsEditing(false)
  }

  return (
    <div className="sidebar__page-row" data-testid={`page-row-${id}`}>
      {isEditing ? (
        <>
          <input
            aria-label="Page title"
            data-testid="page-title-input"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSave()
              if (event.key === 'Escape') setIsEditing(false)
            }}
          />
          <button type="button" onClick={handleSave}>
            Save
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <NavLink to={`/page/${id}`}>{title}</NavLink>
          <button
            type="button"
            aria-label="Toggle favorite"
            onClick={() => onToggleFavorite(id)}
          >
            {favorited ? '★' : '☆'}
          </button>
          <button type="button" aria-label="Rename page" onClick={() => setIsEditing(true)}>
            Rename
          </button>
          <button type="button" aria-label="Trash page" onClick={() => onTrash(id)}>
            Trash
          </button>
        </>
      )}
    </div>
  )
}

export function Sidebar() {
  const { pages, createPage, renamePage, toggleFavorite, trashPage, restorePage } = usePages()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const handler = () => searchRef.current?.focus()
    window.addEventListener('notesai:focus-search', handler)
    return () => window.removeEventListener('notesai:focus-search', handler)
  }, [])

  const { filteredPages, favorites, trashed } = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const activePages = pages.filter((page) => !page.trashed)
    const filtered = query
      ? activePages.filter((page) => page.title.toLowerCase().includes(query))
      : activePages
    const favoritePages = filtered.filter((page) => page.favorited)
    const trashedPages = pages.filter((page) => page.trashed)
    return { filteredPages: filtered, favorites: favoritePages, trashed: trashedPages }
  }, [filter, pages])

  const handleCreatePage = () => {
    const page = createPage()
    navigate(`/page/${page.id}`)
  }

  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar__brand">NotesAI SE</div>
      <nav className="sidebar__nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <div className="sidebar__section">
        <label className="sidebar__section-title" htmlFor="page-search">
          Search
        </label>
        <input
          id="page-search"
          ref={searchRef}
          data-testid="page-search"
          placeholder="Search pages..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <button type="button" data-testid="page-create" onClick={handleCreatePage}>
          New page
        </button>
      </div>
      <div className="sidebar__section">
        <div className="sidebar__section-title">Pages</div>
        {filteredPages.length === 0 ? (
          <div className="sidebar__empty" data-testid="sidebar-empty">
            No pages yet
          </div>
        ) : (
          <ul className="sidebar__list" data-testid="page-list">
            {filteredPages.map((page) => (
              <li key={page.id}>
                <PageRow
                  id={page.id}
                  title={page.title}
                  favorited={page.favorited}
                  onRename={renamePage}
                  onToggleFavorite={toggleFavorite}
                  onTrash={trashPage}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {favorites.length > 0 && (
        <div className="sidebar__section" data-testid="favorites-section">
          <div className="sidebar__section-title">Favorites</div>
          <ul className="sidebar__list" data-testid="favorites-list">
            {favorites.map((page) => (
              <li key={page.id}>
                <NavLink to={`/page/${page.id}`}>{page.title}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      {trashed.length > 0 && (
        <div className="sidebar__section" data-testid="trash-section">
          <div className="sidebar__section-title">Trash</div>
          <ul className="sidebar__list" data-testid="trash-list">
            {trashed.map((page) => (
              <li key={page.id}>
                <span>{page.title}</span>
                <button type="button" aria-label="Restore page" onClick={() => restorePage(page.id)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
