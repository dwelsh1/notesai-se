# NotesAI SE

NotesAI SE is a simplified, local-only variant of NotesAI focused on privacy.
It uses a markdown editor (tiptap) with a top toolbar, slash commands, and AI
integration via LM Studio over local HTTP.

## Key Features

- Local-only storage (SQLite)
- Markdown editor with toolbar and slash commands
- AI commands and chat panel (LM Studio HTTP)
- Multi-tab editing with session restore and pinning
- Slim dashboard (recent, favorites, stats)
- Import/Export (Markdown, JSON, HTML)
- Scheduled and manual backups

## Non-Goals

- Block-based editor (BlockNote)
- Cloud sync or authentication
- Real-time collaboration

## Status

Planning phase. See `docs/notesAI_se-plan.md`.

## Quality

- Lint: `npm run lint`
- Format: `npm run format`

## API

- Internal API overview: `docs/api.md`
