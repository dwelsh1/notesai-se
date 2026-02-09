export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type PromptInput = {
  instruction: string
  pageTitle: string
  pageContent: string
  selection?: string
}

function trimOrEmpty(value?: string) {
  return value?.trim() ?? ''
}

export function buildChatPayload(input: PromptInput): { messages: ChatMessage[] } {
  const instruction = trimOrEmpty(input.instruction)
  const pageTitle = trimOrEmpty(input.pageTitle)
  const pageContent = trimOrEmpty(input.pageContent)
  const selection = trimOrEmpty(input.selection)

  const contextLines = [
    `Title: ${pageTitle || 'Untitled'}`,
    `Content:\n${pageContent || '(empty)'}`,
  ]

  if (selection) {
    contextLines.push(`Selection:\n${selection}`)
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are NotesAI SE, a helpful writing assistant.',
    },
    {
      role: 'user',
      content: `${instruction}\n\n${contextLines.join('\n\n')}`,
    },
  ]

  return { messages }
}
