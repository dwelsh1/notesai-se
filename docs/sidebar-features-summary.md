# Sidebar Features Summary

This document summarizes all sidebar features from NotesAI that should be implemented in NotesAI SE.

## Core Sidebar Features

### 1. Sidebar Toggle

- **Functionality**: Show/hide the entire sidebar
- **Implementation**:
  - Button in sidebar, to the right of the Create New Page (+) button (above Search)
  - Uses `PanelLeft` icon (or `PanelLeftClose` when collapsed)
  - Keyboard shortcut: `Ctrl/Cmd+B`
  - Uses `sidebarCollapsed` state in sidebar context
  - Panel component has `collapsible` prop with `collapsedSize={0}`
- **Visual**: Sidebar completely hidden when collapsed, content panel expands to fill space

### 2. Resizable Width

- **Functionality**: Drag the resize handle to make sidebar wider or narrower
- **Implementation**:
  - Uses `react-resizable-panels` library (`PanelGroup`, `Panel`, `PanelResizeHandle`)
  - Resize handle: 1px wide, gray background, hover effect (darker gray)
  - Minimum width: 96px (1 inch) via CSS `minWidth` style
  - Maximum width: No maximum (unlimited)
  - Default width: 28% of viewport width
  - `onLayout` callback tracks width changes
- **Visual Feedback**: Resize handle changes color on hover

### 3. Width Persistence

- **Functionality**: Remember sidebar width across app launches (Electron only)
- **Implementation**:
  - Setting: "Remember Sidebar Width" toggle in Settings → General Settings
  - Stores width in pixels in settings store (`sidebarWidth`)
  - Also saves to Electron window state if in Electron
  - Restores width on app launch by calculating percentage from saved pixel value
  - Clamps restored width between 20% and 80% of viewport
- **Storage**:
  - Settings store (Zustand persist)
  - Electron window state (if Electron)

### 4. Section Expand/Collapse

- **Functionality**: Each major section can be expanded or collapsed independently
- **Sections**:
  - **Favorites**: Collapsible header with star icon
  - **Pages**: Collapsible header with FileText icon
  - **Trash**: Collapsible header with Trash2 icon
- **Implementation**:
  - Each section has a button header with chevron icon (ChevronDown when expanded, ChevronRight when collapsed)
  - State managed per section: `showFavorites`, `showPages`, `showTrash`
  - Click header to toggle
  - Sections listen for `collapseAllSidebarSections` event
- **Visual**: Chevron icon rotates, content below shows/hides

### 5. Count Badges

- **Functionality**: Display count of items in each section on the right side of section header
- **Implementation**:
  - Favorites: `{favoritedPages.length}` - count of favorited pages
  - Pages: `{nonTrashedPages.length}` - count of non-trashed pages
  - Trash: `{trashedPages.length}` - count of trashed pages
- **Visual**:
  - Small text (`text-xs`), gray color (`text-gray-400`)
  - Positioned with `ml-auto` (right-aligned)
  - Always visible, even when section is collapsed

### 6. Collapse All Sections

- **Functionality**: Keyboard shortcut to collapse all sidebar sections at once
- **Implementation**:
  - Shortcut: `Ctrl/Cmd+Shift+X`
  - Dispatches `collapseAllSidebarSections` custom event
  - All sections listen for this event and collapse themselves
- **Use Case**: Quickly hide all sidebar content to focus on main content

### 7. Auto-Expand Trash

- **Functionality**: Trash section automatically expands when first page is trashed
- **Implementation**:
  - `useEffect` watches `trashedPages.length`
  - When length changes from 0 to 1, sets `showTrash` to `true`
- **Use Case**: User immediately sees where their trashed page went

## Page Hierarchy Features

### 8. Parent/Child Relationships

- **Functionality**: Pages can have parent pages, creating a tree structure
- **Implementation**:
  - Each page has `parentId` field (string | null)
  - Root pages have `parentId: null`
  - Children are sorted by `order` field
  - Tree is built recursively in `buildVisible` function
- **Visual**:
  - Indentation based on depth (each level indented)
  - Chevron icon for expand/collapse per page

### 9. Per-Page Expand/Collapse

- **Functionality**: Each page with children can be expanded or collapsed
- **Implementation**:
  - Each page has `expanded` boolean field (default: false)
  - `toggleExpanded(pageId)` function in pages store
  - Click chevron icon to toggle
  - When collapsed, children are hidden from tree
- **Visual**:
  - ChevronDown when expanded (shows children)
  - ChevronRight when collapsed (hides children)
  - Empty space when page has no children

### 10. Virtualized Page List

- **Functionality**: Uses virtualization for performance with large page lists
- **Implementation**:
  - Uses `@tanstack/react-virtual` library
  - `useVirtualizer` hook for virtual scrolling
  - Only renders visible items in viewport
  - Handles thousands of pages efficiently
- **Benefits**: Smooth scrolling, low memory usage, fast rendering

## Additional Sidebar Features

### 11. Search/Filter Box

- **Functionality**: Filter pages by text search
- **Implementation**:
  - Input field at top of sidebar (below toolbar)
  - `search` state in pages store
  - Filters pages by title matching search term
  - Clear button (X icon) appears when search has text
  - Keyboard shortcut: `Ctrl/Cmd+K` to focus search box
- **Visual**:
  - Search icon on left
  - Clear button on right (when text entered)
  - Placeholder: "Filter pages…"

### 12. Toolbar Buttons

- **Functionality**: Quick action buttons at top of sidebar
- **Buttons**:
  - **New Page** (Plus icon): Creates new page
  - **AI Chat** (MessageCircle icon): Toggles AI chat panel (if AI enabled)
- **Visual**: Small buttons with icons, hover effects

### 13. Semantic Search Button

- **Functionality**: AI-powered semantic search (if AI enabled)
- **Implementation**:
  - Button next to search box (Sparkles icon)
  - Opens semantic search modal
  - Keyboard shortcut: `Ctrl/Cmd+Shift+K`
  - Disabled if AI not available

### 14. Dividers

- **Functionality**: Visual separators between sections
- **Implementation**:
  - Horizontal border lines (`border-t`) between:
    - Search box and Favorites
    - Favorites and Tag Filter
    - Tag Filter and Pages
    - Pages and Trash
- **Visual**: Gray border, 8-12px margin

### 15. Drag and Drop

- **Functionality**: Reorder pages, move to favorites/trash, nest pages, reorder favorites
- **Implementation**:
  - Pages are draggable
  - Drop zones: before, after, on (nest)
  - Visual feedback: blue line shows drop target
  - Drag from PageTree to Favorites adds to favorites
  - Drag to Trash section moves to trash
  - Drag within PageTree reorders/nests pages
  - **Favorites reordering**: Drag within Favorites section to reorder favorites
    - Each favorite item has a drag handle (grip icon)
    - Order persisted via `favoriteOrder` field in database
    - Order maintained across app restarts
- **Visual**:
  - Dragged item becomes semi-transparent
  - Blue line appears at drop target
  - Cursor changes to indicate drag state

### 16. Page Hover Actions

- **Functionality**: Actions appear when hovering over a page
- **Actions**:
  - **Star icon**: Favorite/unfavorite page
  - **Trash icon**: Move page to trash
  - **3 dots menu**: More options — **Duplicate Page**, **Export Page** (JSON download with title-based filename)
- **Visual**:
  - Actions fade in on hover (`invisible group-hover:visible`)
  - Icons appear on right side of page item

### 17. Selected Page Highlighting

- **Functionality**: Currently selected page is highlighted
- **Implementation**:
  - `selectedId` in pages store
  - Page item gets different background color when selected
  - `bg-blue-100 dark:bg-blue-900/40` for selected state
- **Visual**: Blue background tint on selected page

### 18. Scrollable Page List

- **Functionality**: Page list scrolls independently
- **Implementation**:
  - Container has `flex: 1` and `overflow: auto`
  - Favorites and Trash sections are fixed (not in scroll area)
  - Only Pages section scrolls
- **Visual**: Scrollbar appears when content overflows

## Layout Structure

```
Sidebar (Panel)
├── Toolbar (fixed)
│   ├── New Page button
│   ├── AI Chat button
│   └── Search box + Semantic Search button
├── Divider
├── Favorites Section (collapsible, fixed)
│   ├── Header (with count badge)
│   └── Favorites list (flat, draggable, sortable)
│       └── Each item has drag handle for reordering
├── Divider
├── Tag Filter Section (fixed)
├── Divider
├── Pages Section (collapsible, fixed header)
│   ├── Header (with count badge)
│   └── Page Tree (scrollable, virtualized)
│       └── Pages (hierarchical, expandable)
├── Divider
└── Trash Section (collapsible, fixed)
    ├── Header (with count badge)
    └── Trashed pages list
```

## State Management

### Pages Store (Zustand)

- `sidebarCollapsed`: boolean - Is sidebar collapsed?
- `search`: string - Search filter text
- `selectedId`: string | null - Currently selected page ID
- `pages`: Record<string, Page> - All pages
- `toggleSidebar()`: Toggle sidebar collapse state
- `setSearch(text)`: Set search filter
- `select(pageId)`: Select a page
- `toggleExpanded(pageId)`: Toggle page expand/collapse

### Settings Store (Zustand)

- `rememberSidebarWidth`: boolean - Should width be remembered?
- `sidebarWidth`: number | null - Saved sidebar width in pixels
- `setSidebarWidth(width)`: Save sidebar width
- `setRememberSidebarWidth(enabled)`: Enable/disable width persistence

### Component State

- `showFavorites`: boolean - Is Favorites section expanded?
- `showPages`: boolean - Is Pages section expanded?
- `showTrash`: boolean - Is Trash section expanded?

## Keyboard Shortcuts

- `Ctrl/Cmd+B`: Toggle sidebar
- `Ctrl/Cmd+K`: Focus search box
- `Ctrl/Cmd+Shift+K`: Open semantic search (if AI enabled)
- `Ctrl/Cmd+Shift+C`: Toggle AI chat panel (if AI enabled)
- `Ctrl/Cmd+Shift+X`: Collapse all sidebar sections

## Dependencies

- `react-resizable-panels`: Panel resizing
- `@tanstack/react-virtual`: Virtualization
- `lucide-react`: Icons
- `zustand`: State management

## Implementation Status

### Phase 1 (Core Features) — ✅ Complete

- Sidebar toggle (Ctrl+B)
- Resizable width (react-resizable-panels)
- Width persistence (Settings toggle)
- Section expand/collapse (Favorites, Pages, Trash)
- Count badges
- Collapse all sections (Ctrl+Shift+X)
- Auto-expand trash
- Search/filter box
- Dividers
- Selected page highlighting
- Scrollable page list

### Phase 2 (Polish & Refinements) — ✅ Complete

- Improved resizing: 300px default width (from 28%), 150px min, 85% max
- Pixel-based sizing for better visibility
- Fixed sidebar height (extends to bottom of window)
- Layout refinements for optimal page name visibility

### Phase 3 (Page Hierarchy & Virtualization) — ✅ Complete

- **Parent/child relationships**: Pages can have `parentId` to create hierarchical structure
- **Per-page expand/collapse**: Each page with children can be expanded/collapsed with chevron button
- **Virtualized page list**: Uses `@tanstack/react-virtual` for performance with 100+ pages
- **Drag and drop**: Implemented with `@dnd-kit/core` and `@dnd-kit/sortable` for reordering and nesting pages
- **Create child pages**: "+" button appears on hover for each page row to create child pages
- **Auto-expand on child creation**: Parent pages automatically expand when a child is created
- **Circular reference prevention**: Prevents creating circular parent/child relationships

### Phase 3 Additional Feature — ✅ Complete

- **Semantic search button**: AI-powered semantic search using LM Studio
  - Toggle button (Sparkles icon) next to Search label
  - When active, searches pages by meaning rather than keywords
  - Shows loading indicator while searching
  - Displays result count and error messages
  - Results sorted by relevance score
  - Debounced by 500ms to reduce API calls
  - Uses same AI configuration as editor AI panel

### Page Hover Actions — ✅ Complete

- **Star, Trash, More** on each page row (visible on hover). More menu: Duplicate Page, Export Page. Tabs show Pin and Close only (no Star/Trash on tabs).

### Not Implemented (Optional Features)

## Notes for NotesAI SE Implementation

1. **Simplified Version**: NotesAI SE may not need all features (e.g., semantic search, AI chat)
2. **Local Storage**: Use SQLite instead of Zustand persist for width persistence
3. **Virtualization**: Still recommended for performance, even with local storage
4. **Drag and Drop**: Can use native HTML5 drag/drop or a library like `@dnd-kit/core`
5. **Resizable Panels**: `react-resizable-panels` is recommended for smooth resizing
6. **Count Badges**: Simple implementation, just display counts
7. **Section Collapse**: Essential for clean UI, easy to implement with state
