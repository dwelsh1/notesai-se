# Architecture — NotesAI SE

## Overview

NotesAI SE is an Electron-only, local-first app built with React, Vite, and
SQLite. The renderer handles UI, while the main process manages local file
system access, database persistence, backups, and import/export.

## Components

- **Renderer (UI)**: React + tiptap markdown editor, toolbar, slash commands.
- **Main (Electron)**: SQLite service, backups scheduler, import/export.
- **AI**: LM Studio HTTP client (renderer), configurable endpoint/model.

## Data Flow

1. Renderer dispatches actions via Zustand store.
2. Store calls IPC helpers to read/write SQLite data.
3. Main process updates DB and returns results.
4. Renderer updates UI state.

## Storage

- SQLite schema: pages, tabs, settings, assets, backups.
- Migrations run on app startup.

## Security

- Local-only data; no remote sync.
- AI requests sent to local LM Studio only.
