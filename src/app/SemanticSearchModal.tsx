import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, Search, Sparkles, X } from 'lucide-react'
import type { SemanticSearchHit } from '../services/semanticSearchService'
import {
  isSemanticSearchAvailable,
  searchPages,
} from '../services/semanticSearchService'
import { usePages } from '../state/pagesContext'

const DEBOUNCE_MS = 300
const MAX_RESULTS = 15

type SemanticSearchModalProps = {
  isOpen: boolean
  onClose: () => void
}

function similarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'var(--semantic-score-high, #16a34a)'
  if (similarity >= 0.6) return 'var(--semantic-score-mid, #ca8a04)'
  return 'var(--semantic-score-low, #6b7280)'
}

export function SemanticSearchModal({ isOpen, onClose }: SemanticSearchModalProps) {
  const navigate = useNavigate()
  const { pages } = usePages()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [results, setResults] = useState<SemanticSearchHit[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setError(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const hits = await searchPages(q, pages, MAX_RESULTS)
        setResults(hits)
        setSelectedIndex(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [pages],
  )

  useEffect(() => {
    if (!isOpen) return
    setAvailable(null)
    isSemanticSearchAvailable().then(setAvailable)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setResults([])
    setError(null)
    setSelectedIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(query)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
        return
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        navigate(`/page/${results[selectedIndex].pageId}`)
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, navigate, results, selectedIndex])

  const handleSelect = (hit: SemanticSearchHit) => {
    navigate(`/page/${hit.pageId}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop semantic-search-backdrop"
      onClick={onClose}
      data-testid="semantic-search-backdrop"
    >
      <div
        className="semantic-search-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="semantic-search-title"
        data-testid="semantic-search-modal"
      >
        <div className="semantic-search-header">
          <h2 id="semantic-search-title" className="semantic-search-title">
            <Sparkles size={22} aria-hidden />
            Semantic Search
          </h2>
          <button
            type="button"
            className="modal-close"
            title="Close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="semantic-search-input-wrap">
          <Search size={18} className="semantic-search-input-icon" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            className="semantic-search-input"
            placeholder="Search by meaning…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={available === false}
            aria-label="Search by meaning"
            data-testid="semantic-search-input"
          />
          {loading && (
            <Loader2
              size={18}
              className="semantic-search-spinner"
              aria-hidden
            />
          )}
        </div>

        <div className="semantic-search-results">
          {available === false && (
            <div className="semantic-search-state" data-testid="semantic-search-unavailable">
              <p className="semantic-search-state-title">Semantic Search Unavailable</p>
              <p className="semantic-search-state-text">
                Enable AI in Settings → AI Settings → General and ensure LM Studio is
                running with an embedding model loaded.
              </p>
            </div>
          )}
          {available === true && !query.trim() && (
            <div className="semantic-search-state" data-testid="semantic-search-idle">
              <p className="semantic-search-state-title">Search by Meaning</p>
              <p className="semantic-search-state-text">
                Type a query to find pages by meaning, not just exact text matches.
              </p>
            </div>
          )}
          {available === true && query.trim() && error && (
            <div className="semantic-search-state semantic-search-error" data-testid="semantic-search-error">
              <p className="semantic-search-state-title">Search Error</p>
              <p className="semantic-search-state-text">{error}</p>
            </div>
          )}
          {available === true && query.trim() && !error && !loading && results.length === 0 && (
            <div className="semantic-search-state" data-testid="semantic-search-no-results">
              <p className="semantic-search-state-title">No Results Found</p>
              <p className="semantic-search-state-text">
                Try a different query. If this is your first search, embeddings may still be
                generating.
              </p>
            </div>
          )}
          {available === true && results.length > 0 && (
            <>
              <p className="semantic-search-results-count">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <ul className="semantic-search-list" role="listbox" aria-label="Search results">
                {results.map((hit, index) => (
                  <li
                    key={hit.pageId}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`semantic-search-card ${index === selectedIndex ? 'semantic-search-card--selected' : ''}`}
                    onClick={() => handleSelect(hit)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    data-testid={`semantic-search-result-${hit.pageId}`}
                  >
                    <FileText size={18} className="semantic-search-card-icon" aria-hidden />
                    <div className="semantic-search-card-body">
                      <span className="semantic-search-card-title">{hit.title}</span>
                      {hit.subtitle && (
                        <span className="semantic-search-card-subtitle">{hit.subtitle}</span>
                      )}
                      {hit.preview && (
                        <p className="semantic-search-card-preview">{hit.preview}</p>
                      )}
                    </div>
                    <span
                      className="semantic-search-card-score"
                      style={{ color: similarityColor(hit.similarity) }}
                    >
                      {Math.round(hit.similarity * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="semantic-search-footer">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
          <span>Ctrl/Cmd+Shift+K</span>
        </div>
      </div>
    </div>
  )
}
