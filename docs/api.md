# API — NotesAI SE

NotesAI SE is local-only and does not expose a public HTTP API. The "API"
surface is internal:

- **IPC (renderer ↔ main)** for data access (SQLite), backups, and import/export.
- **LM Studio HTTP** for AI requests, configurable in Settings.

## IPC (Planned)

We will document IPC channels as they are added. Each entry will include:

- Channel name
- Direction (renderer → main)
- Request/response payload shape
- Validation and error cases

## LM Studio HTTP (Planned)

Requests are sent to a local LM Studio server over HTTP. The endpoint/model
will be configurable in Settings. We will document:

- Default endpoint and model
- Request/response schema
- Timeouts and error handling
