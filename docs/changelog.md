# Changelog — NotesAI SE

All notable changes to NotesAI SE will be documented in this file.

The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

- **Playwright Smart Reporter**: Intelligent E2E report with failure clustering, flakiness detection, stability scoring, trends, and optional LM Studio–powered failure analysis. Reports in `playwright-reports/` (browser and Electron, separate history per project); view with `npm run test:e2e:report`. See `docs/playwright-smart-report-plan.md` and `docs/testing.md`.
- **Editor toolbar (links, tables, underline, layout)**:
  - **Links**: In-editor link popover (no `prompt()`); URL input with Apply / Remove link / Cancel; works in Electron. Toolbar link button opens popover.
  - **Tables**: TipTap table support with toolbar table dropdown: insert 3×3 table (with header row), add/delete rows and columns, toggle header row, delete table. Resizable columns; thin borders; readable cell text; col-resize cursor on column edges.
  - **Underline**: Underline button and mark (Ctrl+U) added between Italic and Strikethrough in the toolbar.
  - **Toolbar layout**: Divider after highlight (background) color; Open AI and Save are icon-only (Sparkles, Save) with dividers between Open AI, Undo/Redo, and Save; Undo and Redo moved to just before Save with a divider between Redo and Save. All toolbar items (including AI, Undo, Redo, Save) are now inside the single EditorToolbar component.
- **AI Chat panel**: Right-side resizable chat panel (MessageCircle in sidebar or Ctrl+Shift+C). LM Studio integration for conversations, connection status indicator, New/Export/Clear/Close actions, empty and unavailable states, message send with history. Chat history persisted in localStorage; unit tests for `chatHistoryService` and `chatService`; Playwright `ai-chat.spec.ts` with `@chat` tag. See `docs/testing.md` for selectors.
- **AI Chat Phase 2 — RAG and sources**: RAG auto-selection uses semantic search to find top 10 relevant pages per message and injects note excerpts into the chat context. Assistant messages show a collapsible "Sources" section with links to used pages and relevance %. New `ragService` (`getRAGContext`) and unit tests; `chatService` accepts optional `ragContext`; message `sources` include `autoSelected` and `autoSelectedDetails`.
- **AI Chat Phase 3 — Manual selection, files, markdown, retry**: Manual page selection via modal (FileText button; search and multi-select). File uploads (Paperclip; .txt, .md, .json, etc.) in memory for context. Assistant messages render markdown (marked + sanitized HTML). Retry button on failed assistant messages; `retryMessage` re-sends and updates in place. Source groups: "From notes", "Manually selected", "Uploaded files". Attachment chips above input with remove. `ragService` accepts `manualPageIds` and `uploadedFiles`; context cleared after each send.
- **AI Chat Phase 4 — Polish**: Escape closes page selector modal. Input focuses when chat panel opens. Textarea auto-resizes with content (max height 200px, overflow scroll). Keyboard shortcuts: Enter send, Shift+Enter new line, Ctrl+Shift+C toggle panel, Escape close modals. Chat model selection in Settings → AI → Chat Model. Add-pages and attach-files buttons enabled when AI unavailable (context can be prepared before sending).
- **Toast notifications**: Reusable toast component (success/error/info) with `data-testid`s for Playwright. Used for backup, export, and import success/failure feedback. Toast container and styles in App.css.
- **Backup Everything (ZIP)**: "Everything (ZIP)" backup type now produces a single `.zip` file (pages.json, settings.json, media.json, README.txt) instead of separate files. Uses JSZip; Electron writes binary via `writeFile` with base64 encoding (with `.zip` path fallback).
- **PDF export**: Export format now includes PDF. Uses jspdf; in Electron, HTML+images are rendered via Chromium `printToPDF` for full fidelity; in browser, iframe+html2canvas with text-only fallback. Blob image URLs are inlined to data URLs for portability.
- **HTML export**: Export now outputs a full HTML document with in-document styles; page body content is emitted as raw HTML (no escaping) so formatting and images render correctly when opened in a browser. Title remains escaped for safety.
- **Unit tests**: Added/updated tests for `importExport` (exportPagesToHtml full document and title escaping) and new `pdfExport.test.ts` (jsPDF fallback page count, Electron printToPdf mock, empty pages).
- **Sidebar page hover actions**: Star (favorite), Trash (move to trash), and More menu (Duplicate Page, Export Page) appear on row hover in the Pages list; Pin remains on tabs only. Single-page export from More menu uses page title in filename (sanitized). Playwright tests updated to use sidebar action test IDs.
- Initial planning docs created.
- Added ESLint + Prettier configuration and scripts.
- Upgraded Vitest to v4 via audit fix.
- Added Playwright baselines with shared selectors.
- Removed Cypress E2E setup (Playwright-only).
- Added Playwright Electron test config and baseline tests.
- Switched Electron build to NodeNext ESM for Playwright Electron support.
- Added internal API documentation stub.
- Added Phase 1 page tree UI, search, favorites, trash, and shortcuts.
- Added Phase 2 tiptap editor, toolbar, slash menu, and tests.
- Suppressed Electron security warning (dev-only) and React Router future warnings.
- Started Phase 3 with tabs state, tabs bar, and dashboard data.
- Started Phase 4 with import/export and backup policy unit tests.
- Added settings UI stubs for import/export and backups.
- Started Phase 5 with LM Studio client and prompt builder tests.
- Added AI settings and editor panel stubs.
- Added Playwright Phase 5 AI panel coverage (mocked).
- Started Phase 6 with regression tests and error boundary.
- Added Phase 6 regression Playwright flow and accessibility tweaks.
- Fixed layout issues: sidebar positioning, tab bar and editor content visibility, horizontal scrollbars.
- Added editor placeholder using tiptap Placeholder extension with auto-focus on page load.
- Fixed tab closing when pages are trashed; tabs now hide automatically for trashed pages.
- Added permanent delete functionality for trashed pages with confirmation dialog.
- Moved AI panel to top of editor (above content area).
- Improved AI error messages with guidance to Settings for endpoint configuration.
- Reorganized sidebar: moved Create New Page button above Search, added icons to all sections (FileText, Search, Star, Trash2), added dividers between sections, reordered Favorites before Pages.
- Replaced all emoji/Unicode icons with lucide-react icons throughout the app (FileText, Home, Settings, Moon, Star, Pin, Trash2, RotateCcw, X, Plus, Search).
- Added About modal accessible from Help menu in Electron application menu.
- Restored File, Edit, and View menus in Electron with standard keyboard shortcuts.
- Fixed data persistence: pages now save to SQLite and persist across app restarts.
- Fixed editor content isolation: pages now maintain separate content when switching tabs.
- Fixed formatting preservation: switched from Markdown to HTML storage for content to preserve formatting.
- Fixed pin and favorite icon visual states (grey when inactive, red/yellow when active).
- Added PowerShell scripts for starting and stopping the Electron app.
- Fixed Playwright browser E2E tests to match current UI: updated selectors for tab bar actions (favorite, trash), removed references to deprecated sidebar rename button, updated navigation to use header buttons, fixed tests to account for app starting with default tab.
- Fixed unit test mock for `react-resizable-panels` to include `usePanelRef` export.
- **Sidebar Phase 2 (Polish) Complete**: Improved sidebar resizing (increased default width to 300px from 28%, set minSize to 150px, maxSize to 85%, switched to pixel-based sizing for better visibility), fixed sidebar height (ensured sidebar extends to bottom of window when app is stretched taller), and refined layout for optimal page name visibility.
- **Sidebar Phase 3 (Page Hierarchy & Virtualization) Complete**: Implemented parent/child relationships for pages with `parentId` and `order` fields, per-page expand/collapse with chevron buttons, drag and drop for reordering and nesting pages using `@dnd-kit/core` and `@dnd-kit/sortable`, create child page button that appears on hover, auto-expand parent when child is created, circular reference prevention, and virtualized page list using `@tanstack/react-virtual` for performance with 100+ pages.
- **Semantic Search (AI-powered)**: Added semantic search button (Sparkles icon) in sidebar that uses AI to find pages by meaning rather than keywords. Features include toggle between text and semantic search, loading indicator, result count display, error handling, results sorted by relevance score, 500ms debounce, and integration with existing AI configuration (LM Studio endpoint/model/temperature).
- **Semantic Search (embeddings + modal)**: Replaced inline semantic search with a dedicated **Semantic Search** modal. Sparkles button in the sidebar now opens the modal (no longer toggles inline mode). **Ctrl+Shift+K** (Windows/Linux) or **Cmd+Shift+K** (Mac) opens the modal from anywhere. Search uses LM Studio `/v1/embeddings` and local SQLite-stored embeddings with cosine similarity; results show relevance percentage, keyboard navigation (↑↓ and Enter), and Esc closes the modal. Sidebar search is always text-only ("Filter pages...").
- **Favorites Reordering**: Added drag-and-drop reordering for favorites list. Favorites can now be reordered by dragging items within the favorites section. Order is persisted via `favoriteOrder` field in the database and maintained across app restarts. Each favorite item displays a drag handle (grip icon) for reordering.
- **Settings UI Overhaul**: Completely redesigned Settings page with a modern tabbed interface. Main tabs include General Settings, Templates, AI Settings, Tags, Data Management, and Diagnostics. AI Settings includes sub-tabs for General (enable toggle, endpoint config, connection status, model selection, temperature/max tokens) and Prompts (customizable system and user prompts for AI commands). Data Management includes sub-tabs for Import, Export, and Backups. All settings sections now have proper scrolling support.
- **AI Configuration Enhancements**: Enhanced AI settings with comprehensive configuration options including separate model selection for embedding, coding, and chat use cases, connection status indicator, model auto-detection, temperature and max tokens sliders, and customizable prompts for all AI commands. AI features now respect the `aiEnabled` flag throughout the application.
- **Fixed Settings Scrolling**: Fixed scrolling issues in AI Settings and Data Management tabs by properly configuring flex containers and overflow properties. Settings sections now display scrollbars when content overflows.
- **Fixed AppShell Infinite Loop**: Fixed infinite update loop in AppShell caused by sidebar width state updates triggering layout recalculations. Added ref-based tracking to prevent unnecessary state updates.
- **Added Unit Tests**: Added comprehensive unit tests for SettingsTabs, SettingsAI, and SettingsDataManagement components to verify tab navigation and content switching functionality.
