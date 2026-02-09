import { describe, it, expect } from 'vitest'
import { buildChatPayload } from './aiPrompt'

describe('buildChatPayload', () => {
  it('builds messages with page context', () => {
    const payload = buildChatPayload({
      instruction: 'Summarize this.',
      pageTitle: 'Meeting Notes',
      pageContent: 'Line one.\nLine two.',
    })

    expect(payload.messages).toHaveLength(2)
    expect(payload.messages[1].content).toContain('Summarize this.')
    expect(payload.messages[1].content).toContain('Title: Meeting Notes')
    expect(payload.messages[1].content).toContain('Line one.')
  })

  it('includes selection when provided', () => {
    const payload = buildChatPayload({
      instruction: 'Rewrite selection.',
      pageTitle: 'Draft',
      pageContent: 'Full content.',
      selection: 'Selected text.',
    })

    expect(payload.messages[1].content).toContain('Selection:')
    expect(payload.messages[1].content).toContain('Selected text.')
  })
})
