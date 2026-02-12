# API — NotesAI SE

NotesAI SE is local-only and does not expose a public HTTP API. The "API"
surface is internal:

- **IPC (renderer ↔ main)** for data access (SQLite), backups, and import/export.
- **LM Studio HTTP** for AI requests, configurable in Settings.

## IPC Channels

### Pages

#### `pages:list`

- **Direction**: renderer → main
- **Request**: none
- **Response**: `Page[]` - Array of all pages (including trashed)
- **Description**: Returns all pages from SQLite database, ordered by `order` field.

**Page Type**:

```typescript
type Page = {
  id: string
  title: string
  contentMarkdown: string // HTML content (stored as HTML, not Markdown)
  updatedAt: string // ISO 8601 timestamp
  createdAt: string // ISO 8601 timestamp
  trashed: boolean
  favorited: boolean
  parentId: string | null // For page hierarchy (null = root page)
  order: number // Order within parent (for hierarchy)
  favoriteOrder: number | null // Order within favorites list (null if not favorited)
}
```

#### `pages:get`

- **Direction**: renderer → main
- **Request**: `id: string` - Page ID
- **Response**: `Page | null` - Page object or null if not found
- **Description**: Retrieves a single page by ID.

#### `pages:upsert`

- **Direction**: renderer → main
- **Request**: `page: Page` - Complete page object
- **Response**: `void`
- **Description**: Creates or updates a page in SQLite. Uses `INSERT ... ON CONFLICT` for upsert behavior.

#### `pages:delete`

- **Direction**: renderer → main
- **Request**: `id: string` - Page ID
- **Response**: `void`
- **Description**: Permanently deletes a page from SQLite database.

### Application Events

#### `app:show-about`

- **Direction**: main → renderer
- **Payload**: none
- **Description**: Event sent from main process to open the About modal. Triggered from Help menu.

#### `app:new-page`

- **Direction**: main → renderer
- **Payload**: none
- **Description**: Event sent from main process to create a new page. Triggered from File menu (Ctrl+N).

## LM Studio HTTP Client

### Default Configuration

- **Endpoint**: `http://localhost:1234/v1` (configurable in Settings)
- **Model**: `llama-3.1-8b-instruct` (configurable in Settings)
- **Temperature**: `0.2` (configurable in Settings)
- **Timeout**: `15000ms` (15 seconds)

### Request Format

**Endpoint**: `{baseUrl}/chat/completions`

**Method**: `POST`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer {apiKey} (optional)
```

**Body**:

```json
{
  "model": "llama-3.1-8b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant..."
    },
    {
      "role": "user",
      "content": "User instruction here"
    }
  ],
  "temperature": 0.2
}
```

### Response Format

**Success** (200 OK):

```json
{
  "choices": [
    {
      "message": {
        "content": "AI response text here"
      }
    }
  ]
}
```

**Error Handling**:

- **Timeout**: Returns error message "Request timed out. Please check your LM Studio connection and endpoint in Settings (⚙)."
- **Connection Failure**: Returns error message with endpoint URL and guidance to check Settings.
- **HTTP Errors**: Returns error with status code and status text.

### Configuration

Users can configure AI settings in Settings (⚙ icon in header) → AI Settings tab → General sub-tab. Available settings include:

- **Enable AI Features**: Toggle to enable/disable all AI functionality
- **LM Studio Endpoint**: HTTP endpoint URL (default: `http://127.0.0.1:1234/v1`)
- **Connection Status**: Real-time indicator showing connection status and available models
- **Model Selection**: Separate dropdowns for Embedding Model, Code Model, and Chat Model with auto-detection options
- **Temperature**: Slider for controlling AI response randomness (0.0-2.0)
- **Max Tokens**: Slider for controlling maximum response length (100-4000)

The Prompts sub-tab allows customization of system and user prompts for all AI commands (Summarize Selection, Explain Code, Improve Writing, etc.).

All settings are persisted to `localStorage` under the key `notesai-se:config`.

### Semantic Search

**Endpoint**: `{baseUrl}/chat/completions` (same as regular AI chat)

**Method**: `POST`

**Purpose**: Performs semantic search across all pages to find relevant pages based on meaning, not just keyword matching.

**Request Format**: Same as regular chat, but with a specialized prompt that:

1. Provides all active (non-trashed) pages with their titles and content (truncated to 500 chars)
2. Asks the AI to return a JSON array of relevant pages with relevance scores (0.0-1.0) and reasons
3. Filters results to only include pages with relevanceScore >= 0.3
4. Sorts results by relevance score descending

**Response Format**: Same as regular chat, but the `content` field contains a JSON array:

```json
[
  {
    "pageId": "page-id-here",
    "relevanceScore": 0.85,
    "reason": "Brief explanation of relevance"
  }
]
```

**Usage**: Users can toggle semantic search mode using the Sparkles (✨) button next to the Search label in the sidebar. When active, typing in the search box triggers semantic search after a 500ms debounce.
