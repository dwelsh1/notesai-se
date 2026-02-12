import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FileText,
  Trash2,
  RotateCcw,
  Plus,
  Search,
  Star,
  PanelLeft,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Sparkles,
  MoreHorizontal,
  Copy,
  FileDown,
  MessageCircle,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { exportPagesToJson } from '../services/importExport'
import { usePages } from '../state/pagesContext'
import { useSidebar } from '../state/sidebarContext'
import { useSemanticSearchModal } from '../state/semanticSearchContext'
import { useChatPanelOptional } from '../state/chatPanelContext'

type PageRowProps = {
  id: string
  title: string
  depth: number
  hasChildren: boolean
  expanded: boolean
  favorited: boolean
  onToggleExpanded?: () => void
  selected?: boolean
  onCreateChild?: () => void
  onOpenMoreOptions?: (id: string, anchorRect: DOMRect) => void
  openDropdownPageId?: string | null
  isDragging?: boolean
  dropPosition?: 'before' | 'after' | 'on' | null
}

function PageRow({
  id,
  title,
  depth,
  hasChildren,
  expanded,
  favorited,
  onToggleExpanded,
  selected = false,
  onCreateChild,
  onOpenMoreOptions,
  openDropdownPageId,
  isDragging = false,
  dropPosition = null,
}: PageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    data: { type: 'page', depth },
  })

  const moreButtonRef = useRef<HTMLButtonElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const [isHovered, setIsHovered] = useState(false)
  const { toggleFavorite, trashPage } = usePages()

  const dropIndicatorClass = dropPosition ? `sidebar__page-row--drop-${dropPosition}` : ''

  const showActions = isHovered && !isDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sidebar__page-row sidebar__page-row--group ${isDragging ? 'sidebar__page-row--dragging' : ''} ${dropIndicatorClass}`}
      data-testid={`page-row-${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {dropPosition === 'before' && (
        <div className="sidebar__page-row--drop-line sidebar__page-row--drop-line-before" />
      )}
      {dropPosition === 'after' && (
        <div className="sidebar__page-row--drop-line sidebar__page-row--drop-line-after" />
      )}
      {dropPosition === 'on' && <div className="sidebar__page-row--drop-indicator" />}
      <div
        style={{
          paddingLeft: 8 + depth * 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          minWidth: 0,
        }}
      >
        <button
          {...attributes}
          {...listeners}
          className="sidebar__page-drag-handle"
          title="Drag to reorder or nest"
          aria-label="Drag to reorder or nest"
        >
          <GripVertical size={14} />
        </button>
        {hasChildren ? (
          <button
            type="button"
            className="sidebar__page-toggle"
            aria-label={expanded ? 'Collapse page' : 'Expand page'}
            title={expanded ? 'Collapse page' : 'Expand page'}
            onClick={onToggleExpanded}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="sidebar__page-toggle--spacer" />
        )}
        <FileText size={16} className="sidebar__page-icon" />
        <NavLink
          to={`/page/${id}`}
          className={selected ? 'sidebar__link--active' : ''}
          style={{ minWidth: 0, flex: 1 }}
          data-testid={`page-link-${id}`}
        >
          {title}
        </NavLink>
        {showActions && (
          <div className="sidebar__page-actions">
            <button
              type="button"
              className={`sidebar__page-action sidebar__page-action--star ${favorited ? 'sidebar__page-action--favorited' : ''}`}
              title={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
              aria-label={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
              data-testid={`favorite-page-button-${id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(id).catch(console.error)
              }}
            >
              <Star size={14} fill={favorited ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="sidebar__page-action sidebar__page-action--trash"
              title="Move to Trash"
              aria-label="Move to Trash"
              data-testid={`trash-page-button-${id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                trashPage(id).catch(console.error)
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              ref={moreButtonRef}
              type="button"
              className="sidebar__page-action sidebar__page-action--more"
              title="More options"
              aria-label="More options"
              aria-expanded={openDropdownPageId === id}
              data-testid={`more-options-button-${id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenMoreOptions?.(id, moreButtonRef.current?.getBoundingClientRect() ?? new DOMRect())
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
        {showActions && onCreateChild && (
          <button
            type="button"
            className="sidebar__page-create-child"
            title="Create child page"
            aria-label="Create child page"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateChild()
            }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

type FavoriteRowProps = {
  id: string
  title: string
  selected: boolean
  isDragging: boolean
}

function FavoriteRow({ id, title, selected, isDragging }: FavoriteRowProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { toggleFavorite } = usePages()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    data: { type: 'favorite' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const showActions = isHovered && !isDragging

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className="sidebar__page-row"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          {...attributes}
          {...listeners}
          className="sidebar__page-drag-handle"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <NavLink
          to={`/page/${id}`}
          className={selected ? 'sidebar__link--active' : ''}
          style={{ minWidth: 0, flex: 1 }}
          data-testid={`favorite-link-${id}`}
        >
          {title}
        </NavLink>
        {showActions && (
          <div className="sidebar__page-actions">
            <button
              type="button"
              className="sidebar__page-action sidebar__page-action--star sidebar__page-action--favorited"
              title="Remove from Favorites"
              aria-label="Remove from Favorites"
              data-testid={`favorite-page-button-${id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(id).catch(console.error)
              }}
            >
              <Star size={14} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function DroppableSection({
  id,
  isOver,
  children,
}: {
  id: string
  isOver: boolean
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({
    id,
  })

  return (
    <div ref={setNodeRef} className={isOver ? 'sidebar__section--drop-target' : ''}>
      {children}
    </div>
  )
}

export function Sidebar() {
  const {
    pages,
    createPage,
    restorePage,
    deletePage,
    duplicatePage,
    updatePageParent,
    updatePageOrder,
    toggleFavorite,
    trashPage,
    updateFavoriteOrder,
  } = usePages()
  const { collapsed, toggleSidebar, selectedId, setSelectedId } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState('')
  const { openModal: openSemanticSearchModal } = useSemanticSearchModal()
  const chatPanel = useChatPanelOptional()
  const [showFavorites, setShowFavorites] = useState(true)
  const [showPages, setShowPages] = useState(true)
  const [showTrash, setShowTrash] = useState(false)
  const hasAutoExpandedTrash = useRef(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'on' | null>(null)
  const [overSection, setOverSection] = useState<'favorites' | 'trash' | null>(null)
  const [dropBeforeFirst, setDropBeforeFirst] = useState(false)
  const [dropAfterLast, setDropAfterLast] = useState(false)
  const [openDropdownPageId, setOpenDropdownPageId] = useState<string | null>(null)
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null)

  const handleOpenMoreOptions = useCallback((id: string, anchorRect: DOMRect) => {
    setOpenDropdownPageId((prev) => (prev === id ? null : id))
    setDropdownAnchorRect(anchorRect)
  }, [])

  const handleCloseDropdown = useCallback(() => {
    setOpenDropdownPageId(null)
    setDropdownAnchorRect(null)
  }, [])

  const handleExportSinglePage = useCallback((page: { id: string; title: string }) => {
    const pageData = pages.find((p) => p.id === page.id)
    if (!pageData) return
    const json = exportPagesToJson([pageData])
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = (page.title || 'Untitled')
      .replace(/[/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || page.id
    a.download = `notesai-page-${safeName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [pages])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const { filteredPages, favorites, trashed, childrenByParentId } = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const activePages = pages.filter((page) => !page.trashed)

    let filtered = activePages

    if (query) {
      filtered = activePages.filter((page) => page.title.toLowerCase().includes(query))
    }

    const favoritePages = filtered.filter((page) => page.favorited)
    const trashedPages = pages.filter((page) => page.trashed)
    const children = new Map<string | null, typeof pages>()
    for (const page of filtered) {
      const key = page.parentId ?? null
      const group = children.get(key)
      if (group) {
        group.push(page)
      } else {
        children.set(key, [page])
      }
    }
    // Sort each group by `order`
    for (const group of children.values()) {
      group.sort((a, b) => a.order - b.order)
    }
    // Sort favorites by favoriteOrder, then by updatedAt if favoriteOrder is null
    const sortedFavorites = [...favoritePages].sort((a, b) => {
      if (a.favoriteOrder !== null && b.favoriteOrder !== null) {
        return a.favoriteOrder - b.favoriteOrder
      }
      if (a.favoriteOrder !== null) return -1
      if (b.favoriteOrder !== null) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return {
      filteredPages: filtered,
      favorites: sortedFavorites,
      trashed: trashedPages,
      childrenByParentId: children,
    }
  }, [filter, pages])

  useEffect(() => {
    const handler = () => searchRef.current?.focus()
    window.addEventListener('notesai:focus-search', handler)
    return () => window.removeEventListener('notesai:focus-search', handler)
  }, [])

  // Keyboard shortcut for sidebar toggle (Ctrl/Cmd+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleSidebar()
      }
      // Keyboard shortcut for collapse all sections (Ctrl/Cmd+Shift+X)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'x') {
        event.preventDefault()
        setShowFavorites(false)
        setShowPages(false)
        setShowTrash(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // Update selectedId when location changes
  useEffect(() => {
    const match = location.pathname.match(/^\/page\/(.+)$/)
    if (match) {
      setSelectedId(match[1])
    } else {
      setSelectedId(null)
    }
  }, [location.pathname, setSelectedId])

  // Auto-expand Trash when first page is trashed (only once)
  useEffect(() => {
    if (trashed.length > 0 && !hasAutoExpandedTrash.current) {
      hasAutoExpandedTrash.current = true
      setShowTrash(true)
    } else if (trashed.length === 0) {
      // Reset flag when trash is empty
      hasAutoExpandedTrash.current = false
    }
  }, [trashed.length])

  const handleCreatePage = async (parentId?: string | null) => {
    const page = await createPage(undefined, parentId)
    navigate(`/page/${page.id}`)
    // Auto-expand parent if creating a child
    if (parentId) {
      setExpandedIds((prev) => new Set(prev).add(parentId))
    }
  }

  const toggleSection = (section: 'favorites' | 'pages' | 'trash') => {
    if (section === 'favorites') setShowFavorites(!showFavorites)
    if (section === 'pages') setShowPages(!showPages)
    if (section === 'trash') setShowTrash(!showTrash)
  }

  const togglePageExpanded = (pageId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const visiblePageNodes = useMemo(() => {
    const nodes: Array<{ page: (typeof pages)[number]; depth: number }> = []

    const walk = (parentId: string | null, depth: number) => {
      const children = childrenByParentId.get(parentId)
      if (!children) return
      for (const page of children) {
        nodes.push({ page, depth })
        if (expandedIds.has(page.id)) {
          walk(page.id, depth + 1)
        }
      }
    }

    // When filtering, show a flat list (depth 0) to keep UX simple
    if (filter.trim()) {
      for (const page of filteredPages) {
        nodes.push({ page, depth: 0 })
      }
      return nodes
    }

    walk(null, 0)
    return nodes
  }, [childrenByParentId, expandedIds, filteredPages, filter])

  const handleDragStart = (event: DragStartEvent) => {
    handleCloseDropdown()
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) {
      setOverId(null)
      setDropPosition(null)
      setOverSection(null)
      return
    }

    const overIdStr = over.id as string

    // Check if dragging over Favorites section
    if (overIdStr === 'favorites-section') {
      setOverSection('favorites')
      setOverId(null)
      setDropPosition(null)
      return
    }

    // Check if dragging over Trash section
    if (overIdStr === 'trash-section') {
      setOverSection('trash')
      setOverId(null)
      setDropPosition(null)
      return
    }

    // Reset section if not over a section
    setOverSection(null)
    setDropBeforeFirst(false)
    setDropAfterLast(false)

    // Check for edge drop zones (before first, after last)
    if (overIdStr === 'drop-before-first') {
      setDropBeforeFirst(true)
      setOverId(null)
      setDropPosition(null)
      return
    }
    if (overIdStr === 'drop-after-last') {
      setDropAfterLast(true)
      setOverId(null)
      setDropPosition(null)
      return
    }

    // Handle page drop zones
    const overPage = pages.find((p) => p.id === overIdStr)
    if (!overPage || overPage.id === active.id) {
      setOverId(null)
      setDropPosition(null)
      return
    }

    setOverId(overIdStr)

    // Calculate drop position based on collision data
    const draggedPage = pages.find((p) => p.id === active.id)
    if (!draggedPage) {
      setDropPosition('on')
      return
    }

    const draggedDepth = visiblePageNodes.find((n) => n.page.id === draggedPage.id)?.depth ?? 0
    const overDepth = visiblePageNodes.find((n) => n.page.id === overPage.id)?.depth ?? 0

    // Get the over element's rect - use over.rect if available, otherwise query DOM
    let rect: { top: number; height: number } | null = null
    if (over.rect) {
      rect = {
        top: over.rect.top,
        height: over.rect.height,
      }
    } else {
      const overElement = document.querySelector(
        `[data-testid="page-row-${overIdStr}"]`,
      ) as HTMLElement
      if (overElement) {
        const domRect = overElement.getBoundingClientRect()
        rect = {
          top: domRect.top,
          height: domRect.height,
        }
      }
    }

    // Find the index of the overPage in visiblePageNodes
    const overNodeIndex = visiblePageNodes.findIndex((n) => n.page.id === overPage.id)
    const isFirst = overNodeIndex === 0
    const isLast = overNodeIndex === visiblePageNodes.length - 1

    if (rect) {
      // Get mouse Y position - try multiple methods
      let mouseY: number | null = null

      // Method 1: Try activatorEvent
      const dragEvent = (event as any).activatorEvent as MouseEvent | undefined
      if (dragEvent && dragEvent.clientY !== undefined) {
        mouseY = dragEvent.clientY
      }

      // Method 2: Try event.delta (relative movement)
      if (mouseY === null && (event as any).delta) {
        const delta = (event as any).delta
        // Use the rect center as base and add delta
        mouseY = rect.top + rect.height / 2 + (delta.y || 0)
      }

      // Method 3: Try to get from active element's position
      if (mouseY === null && active.rect) {
        const activeRect = active.rect as unknown as {
          initial: { top: number; height: number } | null
          translated: { top: number; height: number } | null
        } | null
        const rectToUse = activeRect?.translated || activeRect?.initial
        if (
          rectToUse &&
          typeof rectToUse.top === 'number' &&
          typeof rectToUse.height === 'number'
        ) {
          mouseY = rectToUse.top + rectToUse.height / 2
        }
      }

      if (mouseY !== null) {
        const elementTop = rect.top
        const elementHeight = rect.height
        const relativeY = mouseY - elementTop // Position relative to top of element
        const relativePercent = relativeY / elementHeight // 0.0 to 1.0

        // For first item: top 50% = before (makes it very easy to drop at top)
        // For last item: bottom 50% = after (makes it very easy to drop at bottom)
        // For middle items: top 30% = before, middle 40% = on, bottom 30% = after
        if (isFirst) {
          if (relativePercent < 0.5) {
            setDropPosition('before')
          } else if (relativePercent > 0.7) {
            setDropPosition('after')
          } else {
            setDropPosition(overDepth >= draggedDepth ? 'on' : 'after')
          }
        } else if (isLast) {
          if (relativePercent > 0.5) {
            setDropPosition('after')
          } else if (relativePercent < 0.3) {
            setDropPosition('before')
          } else {
            setDropPosition(overDepth >= draggedDepth ? 'on' : 'after')
          }
        } else {
          // Middle items: use 30% thresholds
          if (relativePercent < 0.3) {
            setDropPosition('before')
          } else if (relativePercent > 0.7) {
            setDropPosition('after')
          } else {
            setDropPosition(overDepth >= draggedDepth ? 'on' : 'after')
          }
        }
        return
      }
    }

    // Fallback: use depth comparison
    if (overDepth >= draggedDepth) {
      setDropPosition('on')
    } else {
      setDropPosition('after')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)
    setDropPosition(null)
    setOverSection(null)
    setDropBeforeFirst(false)
    setDropAfterLast(false)

    if (!over || active.id === over.id) {
      return
    }

    const draggedPage = pages.find((p) => p.id === active.id)
    if (!draggedPage) return

    const overIdStr = over.id as string

    // Handle edge drops
    if (overIdStr === 'drop-before-first') {
      const firstNode = visiblePageNodes[0]
      if (firstNode) {
        const firstPage = firstNode.page
        const newParentId = firstPage.parentId
        await updatePageParent(draggedPage.id, newParentId)
        await updatePageOrder(draggedPage.id, 0)
        // Shift all siblings down
        const siblings = pages.filter(
          (p) => p.parentId === newParentId && p.id !== draggedPage.id && !p.trashed,
        )
        for (const sibling of siblings) {
          await updatePageOrder(sibling.id, sibling.order + 1)
        }
      }
      return
    }
    if (overIdStr === 'drop-after-last') {
      const lastNode = visiblePageNodes[visiblePageNodes.length - 1]
      if (lastNode) {
        const lastPage = lastNode.page
        const newParentId = lastPage.parentId
        await updatePageParent(draggedPage.id, newParentId)
        const siblings = pages.filter(
          (p) => p.parentId === newParentId && p.id !== draggedPage.id && !p.trashed,
        )
        const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) : -1
        await updatePageOrder(draggedPage.id, maxOrder + 1)
      }
      return
    }

    // Handle drag to Favorites section (for adding to favorites)
    if (overIdStr === 'favorites-section') {
      if (!draggedPage.favorited) {
        await toggleFavorite(draggedPage.id)
      }
      return
    }

    // Handle drag within Favorites section (for reordering)
    const favoritePage = favorites.find((p) => p.id === overIdStr)
    if (favoritePage && draggedPage.favorited && active.id !== over.id) {
      // Reorder favorites
      const overIndex = favorites.findIndex((p) => p.id === overIdStr)
      const draggedIndex = favorites.findIndex((p) => p.id === draggedPage.id)

      if (overIndex !== draggedIndex && overIndex >= 0 && draggedIndex >= 0) {
        // Calculate new favoriteOrder based on target position
        const updatedFavorites = [...favorites]
        updatedFavorites.splice(draggedIndex, 1)
        updatedFavorites.splice(overIndex, 0, draggedPage)

        // Update all favorite orders
        for (let i = 0; i < updatedFavorites.length; i++) {
          await updateFavoriteOrder(updatedFavorites[i].id, i)
        }
      }
      return
    }

    // Handle drag to Trash section
    if (overIdStr === 'trash-section') {
      if (!draggedPage.trashed) {
        await trashPage(draggedPage.id)
      }
      return
    }

    // Handle drag within Pages section
    const overPage = pages.find((p) => p.id === overIdStr)
    if (!overPage) {
      // Dropped on empty space or root - move to root
      await updatePageParent(draggedPage.id, null)
      // Recalculate order based on position
      const rootPages = pages.filter((p) => !p.parentId && p.id !== draggedPage.id && !p.trashed)
      const newOrder = rootPages.length
      await updatePageOrder(draggedPage.id, newOrder)
      return
    }

    // Use the drop position from drag over state
    const finalDropPosition = dropPosition || 'on'

    if (finalDropPosition === 'on') {
      // Nest as child
      await updatePageParent(draggedPage.id, overPage.id)
      // Auto-expand the parent
      setExpandedIds((prev) => new Set(prev).add(overPage.id))
      // Calculate order as last child
      const siblings = pages.filter(
        (p) => p.parentId === overPage.id && p.id !== draggedPage.id && !p.trashed,
      )
      const newOrder = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) + 1 : 0
      await updatePageOrder(draggedPage.id, newOrder)
    } else {
      // Reorder before or after
      const newParentId = overPage.parentId
      await updatePageParent(draggedPage.id, newParentId)

      // Calculate order based on position
      const siblings = pages.filter(
        (p) => p.parentId === newParentId && p.id !== draggedPage.id && !p.trashed,
      )
      const overIndex = siblings.findIndex((p) => p.id === overPage.id)

      // Find the index in visiblePageNodes to check if it's first or last
      const overNodeIndex = visiblePageNodes.findIndex((n) => n.page.id === overPage.id)
      const isFirst = overNodeIndex === 0
      const isLast = overNodeIndex === visiblePageNodes.length - 1

      let newOrder: number
      if (finalDropPosition === 'before') {
        // Insert before overPage
        if (isFirst) {
          // If it's the first item, set order to 0 and shift all others up
          newOrder = 0
          // Shift all siblings down
          for (const sibling of siblings) {
            if (sibling.order >= 0) {
              await updatePageOrder(sibling.id, sibling.order + 1)
            }
          }
        } else {
          newOrder = overIndex >= 0 ? overPage.order : 0
          // Shift other pages down
          for (const sibling of siblings) {
            if (sibling.order >= newOrder && sibling.id !== overPage.id) {
              await updatePageOrder(sibling.id, sibling.order + 1)
            }
          }
        }
      } else {
        // Insert after overPage
        if (isLast) {
          // If it's the last item, set order to max + 1
          const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((p) => p.order)) : -1
          newOrder = maxOrder + 1
        } else {
          newOrder = overIndex >= 0 ? overPage.order + 1 : siblings.length
          // Shift other pages down
          for (const sibling of siblings) {
            if (sibling.order > overPage.order && sibling.id !== overPage.id) {
              await updatePageOrder(sibling.id, sibling.order + 1)
            }
          }
        }
      }
      await updatePageOrder(draggedPage.id, newOrder)
    }
  }

  const scrollParentRef = useRef<HTMLUListElement | null>(null)

  const useVirtual = visiblePageNodes.length > 100

  // Always call useVirtualizer (React hooks must be called unconditionally)
  const rowVirtualizer = useVirtualizer({
    count: visiblePageNodes.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 28,
    overscan: 8,
    enabled: useVirtual, // Use enabled option instead of conditional call
  })

  const activePage = activeId ? visiblePageNodes.find((n) => n.page.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar__header">
          <div className="sidebar__brand">NotesAI SE</div>
          <div className="sidebar__toolbar">
            <button
              type="button"
              className="sidebar__create-button"
              data-testid="page-create"
              title="Create new page"
              onClick={() => handleCreatePage()}
            >
              <Plus size={18} />
            </button>
            {chatPanel && (
              <button
                type="button"
                className="sidebar__toggle-button"
                data-testid="ai-chat-toggle"
                title="AI Chat (Ctrl+Shift+C)"
                onClick={chatPanel.toggle}
                aria-label="Toggle AI Chat panel"
              >
                <MessageCircle size={18} />
              </button>
            )}
            <button
              type="button"
              className="sidebar__toggle-button"
              data-testid="sidebar-toggle"
              title={collapsed ? 'Show sidebar (Ctrl+B)' : 'Hide sidebar (Ctrl+B)'}
              onClick={toggleSidebar}
            >
              {collapsed ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          </div>
        </div>
        <div className="sidebar__section">
          <div className="sidebar__search-header">
            <label className="sidebar__section-title" htmlFor="page-search">
              <Search size={14} />
              Search
            </label>
            <button
              type="button"
              className="sidebar__semantic-toggle"
              data-testid="semantic-search-toggle"
              title="Semantic Search (Ctrl/Cmd+Shift+K)"
              onClick={openSemanticSearchModal}
            >
              <Sparkles size={14} />
            </button>
          </div>
          <div className="sidebar__search-wrap">
            <input
              id="page-search"
              ref={searchRef}
              data-testid="page-search"
              placeholder="Filter pages..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={filter.trim() ? 'sidebar__search-input--has-value' : ''}
            />
            {filter.trim().length > 0 && (
              <button
                type="button"
                className="sidebar__search-clear"
                data-testid="page-search-clear"
                title="Clear search"
                aria-label="Clear search"
                onClick={() => {
                  setFilter('')
                  searchRef.current?.focus()
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="sidebar__divider" />
        {favorites.length > 0 && (
          <DroppableSection id="favorites-section" isOver={overSection === 'favorites'}>
            <div
              className={`sidebar__section ${overSection === 'favorites' ? 'sidebar__section--drop-target' : ''}`}
              data-testid="favorites-section"
            >
              <button
                type="button"
                className="sidebar__section-header"
                onClick={() => toggleSection('favorites')}
              >
                <div className="sidebar__section-title">
                  {showFavorites ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Star size={14} />
                  Favorites
                </div>
                <span className="sidebar__count-badge">{favorites.length}</span>
              </button>
              {showFavorites && (
                <SortableContext
                  items={favorites.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="sidebar__list" data-testid="favorites-list">
                    {favorites.map((page) => (
                      <FavoriteRow
                        key={page.id}
                        id={page.id}
                        title={page.title}
                        selected={selectedId === page.id}
                        isDragging={activeId === page.id}
                      />
                    ))}
                  </ul>
                </SortableContext>
              )}
            </div>
          </DroppableSection>
        )}
        {favorites.length > 0 && <div className="sidebar__divider" />}
        <div className="sidebar__section sidebar__section--scrollable">
          <button
            type="button"
            className="sidebar__section-header"
            onClick={() => toggleSection('pages')}
          >
            <div className="sidebar__section-title">
              {showPages ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FileText size={14} />
              Pages
            </div>
            <span className="sidebar__count-badge">{filteredPages.length}</span>
          </button>
          {showPages && (
            <SortableContext
              items={visiblePageNodes.map((n) => n.page.id)}
              strategy={verticalListSortingStrategy}
            >
              {visiblePageNodes.length === 0 ? (
                <div className="sidebar__empty" data-testid="sidebar-empty">
                  No pages yet
                </div>
              ) : !useVirtual || !rowVirtualizer ? (
                <ul className="sidebar__list" data-testid="page-list">
                  {/* Drop zone before first item */}
                  {visiblePageNodes.length > 0 && (
                    <li>
                      <DroppableSection id="drop-before-first" isOver={dropBeforeFirst}>
                        <div
                          className={`sidebar__drop-zone ${dropBeforeFirst ? 'sidebar__drop-zone--active' : ''}`}
                          style={{ height: '4px', marginBottom: '2px' }}
                        />
                      </DroppableSection>
                    </li>
                  )}
                  {visiblePageNodes.map(({ page, depth }) => {
                    const hasChildren = !!childrenByParentId.get(page.id)
                    const expanded = expandedIds.has(page.id)
                    return (
                      <li key={page.id}>
                        <PageRow
                          id={page.id}
                          title={page.title}
                          depth={depth}
                          hasChildren={hasChildren}
                          expanded={expanded}
                          favorited={page.favorited}
                          onToggleExpanded={
                            hasChildren ? () => togglePageExpanded(page.id) : undefined
                          }
                          selected={selectedId === page.id}
                          onCreateChild={() => handleCreatePage(page.id)}
                          onOpenMoreOptions={handleOpenMoreOptions}
                          openDropdownPageId={openDropdownPageId}
                          isDragging={activeId === page.id}
                          dropPosition={overId === page.id ? dropPosition : null}
                        />
                      </li>
                    )
                  })}
                  {/* Drop zone after last item */}
                  {visiblePageNodes.length > 0 && (
                    <li>
                      <DroppableSection id="drop-after-last" isOver={dropAfterLast}>
                        <div
                          className={`sidebar__drop-zone ${dropAfterLast ? 'sidebar__drop-zone--active' : ''}`}
                          style={{ height: '4px', marginTop: '2px' }}
                        />
                      </DroppableSection>
                    </li>
                  )}
                </ul>
              ) : (
                <ul className="sidebar__list" data-testid="page-list" ref={scrollParentRef}>
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize() + 6}px`,
                      position: 'relative',
                    }}
                  >
                    {/* Drop zone before first item */}
                    {visiblePageNodes.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                        }}
                      >
                        <DroppableSection id="drop-before-first" isOver={dropBeforeFirst}>
                          <div
                            className={`sidebar__drop-zone ${dropBeforeFirst ? 'sidebar__drop-zone--active' : ''}`}
                            style={{ height: '100%' }}
                          />
                        </DroppableSection>
                      </div>
                    )}
                    {rowVirtualizer.getVirtualItems().map((item) => {
                      const { page, depth } = visiblePageNodes[item.index]
                      const hasChildren = !!childrenByParentId.get(page.id)
                      const expanded = expandedIds.has(page.id)
                      return (
                        <li
                          key={page.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${item.start}px)`,
                          }}
                        >
                          <PageRow
                            id={page.id}
                            title={page.title}
                            depth={depth}
                            hasChildren={hasChildren}
                            expanded={expanded}
                            favorited={page.favorited}
                            onToggleExpanded={
                              hasChildren ? () => togglePageExpanded(page.id) : undefined
                            }
                            selected={selectedId === page.id}
                            onCreateChild={() => handleCreatePage(page.id)}
                            onOpenMoreOptions={handleOpenMoreOptions}
                            openDropdownPageId={openDropdownPageId}
                            isDragging={activeId === page.id}
                            dropPosition={overId === page.id ? dropPosition : null}
                          />
                        </li>
                      )
                    })}
                    {/* Drop zone after last item */}
                    {visiblePageNodes.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: `${rowVirtualizer.getTotalSize()}px`,
                          left: 0,
                          right: 0,
                          height: '4px',
                        }}
                      >
                        <DroppableSection id="drop-after-last" isOver={dropAfterLast}>
                          <div
                            className={`sidebar__drop-zone ${dropAfterLast ? 'sidebar__drop-zone--active' : ''}`}
                            style={{ height: '100%' }}
                          />
                        </DroppableSection>
                      </div>
                    )}
                  </div>
                </ul>
              )}
            </SortableContext>
          )}
        </div>
        {trashed.length > 0 && (
          <>
            <div className="sidebar__divider" />
            <DroppableSection id="trash-section" isOver={overSection === 'trash'}>
              <div
                className={`sidebar__section ${overSection === 'trash' ? 'sidebar__section--drop-target' : ''}`}
                data-testid="trash-section"
              >
                <button
                  type="button"
                  className="sidebar__section-header"
                  onClick={() => toggleSection('trash')}
                >
                  <div className="sidebar__section-title">
                    {showTrash ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Trash2 size={14} />
                    Trash
                  </div>
                  <span className="sidebar__count-badge">{trashed.length}</span>
                </button>
                {showTrash && (
                  <ul className="sidebar__list" data-testid="trash-list">
                    {trashed.map((page) => (
                      <li key={page.id} className="sidebar__trash-item">
                        <span className="sidebar__trash-title">{page.title}</span>
                        <button
                          type="button"
                          className="sidebar__trash-action sidebar__trash-restore"
                          aria-label="Restore page"
                          title="Restore page"
                          onClick={() => {
                            restorePage(page.id).catch(console.error)
                          }}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          type="button"
                          className="sidebar__trash-action sidebar__trash-delete"
                          aria-label="Permanently delete page"
                          title="Permanently delete page"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Permanently delete "${page.title}"? This cannot be undone.`,
                              )
                            ) {
                              deletePage(page.id).catch(console.error)
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DroppableSection>
          </>
        )}
        <DragOverlay>
          {activePage ? (
            <div
              className="sidebar__page-row sidebar__page-row--dragging"
              style={{ paddingLeft: 8 + activePage.depth * 12 }}
            >
              <FileText size={16} className="sidebar__page-icon" />
              {activePage.page.title}
            </div>
          ) : null}
        </DragOverlay>
        {openDropdownPageId &&
          dropdownAnchorRect &&
          createPortal(
            <>
              <div
                className="sidebar__dropdown-backdrop"
                role="presentation"
                aria-hidden
                onClick={handleCloseDropdown}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div
                className="sidebar__dropdown-menu"
                role="menu"
                style={{
                  position: 'fixed',
                  top: dropdownAnchorRect.bottom + 4,
                  left: Math.max(
                    8,
                    dropdownAnchorRect.right - 220,
                  ),
                  minWidth: 200,
                }}
              >
                {(() => {
                  const page = pages.find((p) => p.id === openDropdownPageId)
                  if (!page) return null
                  return (
                    <>
                      <button
                        type="button"
                        className="sidebar__dropdown-item"
                        role="menuitem"
                        data-testid={`duplicate-page-button-${page.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicatePage(page.id).then(() => handleCloseDropdown()).catch(console.error)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Copy size={14} />
                        <span>Duplicate Page</span>
                      </button>
                      <button
                        type="button"
                        className="sidebar__dropdown-item"
                        role="menuitem"
                        data-testid={`export-page-button-${page.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportSinglePage(page)
                          handleCloseDropdown()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <FileDown size={14} />
                        <span>Export Page</span>
                      </button>
                    </>
                  )
                })()}
              </div>
            </>,
            document.body,
          )}
      </aside>
    </DndContext>
  )
}
