export type CommandId =
  | 'summarizeSelection'
  | 'rewriteConcise'
  | 'fixGrammar'
  | 'changeTone'
  | 'generateTitleSubtitle'
  | 'generateTags'
  | 'outlineFromMessyNotes'
  | 'expandElaborate'
  | 'extractActionItems'
  | 'generateMermaidDiagram'
  | 'updateMermaidDiagram'
  | 'fixMermaidErrors'
  | 'explainCode'
  | 'codeReview'
  | 'optimizeCode'
  | 'refactorToPattern'
  | 'securityAudit'
  | 'addDocumentation'
  | 'generateTests'

export type PromptContent = {
  system?: string
  user: string
}

export type CommandDefinition = {
  id: CommandId
  name: string
  description: string
  shortDescription: string
  category: 'text' | 'content' | 'code'
  icon: string
  variables: string[]
  defaultPrompt: PromptContent
}

const defaultSystemPrompt = `You are an expert AI assistant integrated into a notes application. Your role is to help users improve, generate, and manage their content efficiently. Always provide clear, accurate, and helpful responses.`

export const commandDefinitions: CommandDefinition[] = [
  {
    id: 'summarizeSelection',
    name: 'Summarize Selection',
    description: 'Generate concise summary with bullet highlights',
    shortDescription: 'Summarize selected text',
    category: 'text',
    icon: 'FileText',
    variables: ['SELECTION', 'SCOPE'],
    defaultPrompt: {
      system: `You are an expert content summarizer specializing in creating concise, accurate summaries for a notes app. Extract key information while preserving factual accuracy and maintaining clarity. Focus on essential points and eliminate redundancy.`,
      user: `Summarize the following content in approximately 120 words. Return two parts:
1. **Summary**: A concise paragraph capturing the main points (no preamble or introduction).
2. **Key Highlights**: 3-5 bullet points (markdown format with "- ") covering the most important details.

Preserve factual accuracy. Keep any code blocks, links, or technical terms intact. Focus on the essential information.

Content:
{{SELECTION}}`,
    },
  },
  {
    id: 'rewriteConcise',
    name: 'Rewrite Concise',
    description: 'Make text more concise while preserving meaning',
    shortDescription: 'Make text more concise',
    category: 'text',
    icon: 'FileText',
    variables: ['SELECTION'],
    defaultPrompt: {
      user: `Rewrite the following text to be more concise while preserving all essential meaning and information. Remove redundancy and wordiness, but keep all important details:

{{SELECTION}}`,
    },
  },
  {
    id: 'fixGrammar',
    name: 'Fix Grammar & Clarity',
    description: 'Fix grammar, spelling, and improve clarity',
    shortDescription: 'Fix grammar and clarity',
    category: 'text',
    icon: 'FileText',
    variables: ['SELECTION'],
    defaultPrompt: {
      user: `Fix grammar, spelling, and improve clarity in the following text. Preserve the original meaning and style:

{{SELECTION}}`,
    },
  },
  {
    id: 'changeTone',
    name: 'Change Tone',
    description: 'Change the tone of the text (formal, casual, professional, etc.)',
    shortDescription: 'Change writing tone',
    category: 'text',
    icon: 'FileText',
    variables: ['SELECTION'],
    defaultPrompt: {
      user: `Rewrite the following text to have a more professional and formal tone, while preserving all meaning:

{{SELECTION}}`,
    },
  },
  {
    id: 'generateTitleSubtitle',
    name: 'Generate Title & Subtitle',
    description: 'Generate a title and subtitle for the content',
    shortDescription: 'Generate title and subtitle',
    category: 'content',
    icon: 'FileText',
    variables: ['SCOPE'],
    defaultPrompt: {
      user: `Generate a concise, descriptive title and subtitle for the following content. The title should be 5-10 words, and the subtitle should be 10-20 words and provide context.

Content:
{{SCOPE}}

Return in this format:
**Title**: [title here]
**Subtitle**: [subtitle here]`,
    },
  },
  {
    id: 'generateTags',
    name: 'Generate Tags',
    description: 'Generate relevant tags for the content',
    shortDescription: 'Generate content tags',
    category: 'content',
    icon: 'FileText',
    variables: ['SCOPE'],
    defaultPrompt: {
      user: `Generate 3-7 relevant tags for the following content. Tags should be single words or short phrases (2-3 words max), lowercase, and separated by commas.

Content:
{{SCOPE}}

Return only the tags, comma-separated, no other text.`,
    },
  },
  {
    id: 'outlineFromMessyNotes',
    name: 'Outline From Messy Notes',
    description: 'Create a structured outline from unstructured notes',
    shortDescription: 'Create outline from notes',
    category: 'content',
    icon: 'FileText',
    variables: ['SCOPE'],
    defaultPrompt: {
      user: `Transform the following messy notes into a well-structured outline with clear hierarchy. Use markdown formatting with headings and bullet points:

{{SCOPE}}`,
    },
  },
  {
    id: 'expandElaborate',
    name: 'Expand / Elaborate',
    description: 'Expand and elaborate on the selected content',
    shortDescription: 'Expand content',
    category: 'content',
    icon: 'FileText',
    variables: ['SELECTION'],
    defaultPrompt: {
      user: `Expand and elaborate on the following content. Add more detail, context, and explanation while maintaining the original meaning and style:

{{SELECTION}}`,
    },
  },
  {
    id: 'extractActionItems',
    name: 'Extract Action Items',
    description: 'Extract action items and tasks from content',
    shortDescription: 'Extract action items',
    category: 'content',
    icon: 'FileText',
    variables: ['SCOPE'],
    defaultPrompt: {
      user: `Extract all action items, tasks, and to-dos from the following content. List them as a bulleted list in markdown format:

{{SCOPE}}`,
    },
  },
  {
    id: 'generateMermaidDiagram',
    name: 'Generate Mermaid Diagram',
    description: 'Generate a Mermaid diagram from text description',
    shortDescription: 'Generate Mermaid diagram',
    category: 'content',
    icon: 'FileText',
    variables: ['SELECTION', 'TASK'],
    defaultPrompt: {
      user: `Generate a Mermaid diagram based on the following description. Return only valid Mermaid syntax, no explanations:

{{SELECTION}}`,
    },
  },
  {
    id: 'updateMermaidDiagram',
    name: 'Update Mermaid Diagram',
    description: 'Update an existing Mermaid diagram',
    shortDescription: 'Update Mermaid diagram',
    category: 'content',
    icon: 'FileText',
    variables: ['SELECTION', 'TASK'],
    defaultPrompt: {
      user: `Update the following Mermaid diagram based on the requested changes. Return only valid Mermaid syntax:

Current diagram:
{{SELECTION}}

Changes requested: {{TASK}}`,
    },
  },
  {
    id: 'fixMermaidErrors',
    name: 'Fix Mermaid Errors',
    description: 'Fix syntax errors in a Mermaid diagram',
    shortDescription: 'Fix Mermaid errors',
    category: 'content',
    icon: 'FileText',
    variables: ['SELECTION'],
    defaultPrompt: {
      user: `Fix any syntax errors in the following Mermaid diagram. Return only the corrected Mermaid syntax:

{{SELECTION}}`,
    },
  },
  {
    id: 'explainCode',
    name: 'Explain Code',
    description: 'Explain what the code does',
    shortDescription: 'Explain code functionality',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Explain what the following code does. Be clear and concise:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'codeReview',
    name: 'Code Review',
    description: 'Review code for issues and improvements',
    shortDescription: 'Review code for issues',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Review the following code for bugs, performance issues, best practices, and potential improvements. Provide specific, actionable feedback:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'optimizeCode',
    name: 'Optimize Code',
    description: 'Optimize code for performance and efficiency',
    shortDescription: 'Optimize code performance',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Optimize the following code for performance and efficiency. Provide the optimized code with brief explanations of changes:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'refactorToPattern',
    name: 'Refactor to Pattern',
    description: 'Refactor code to use a specific design pattern',
    shortDescription: 'Refactor to design pattern',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE', 'PATTERN'],
    defaultPrompt: {
      user: `Refactor the following code to use the {{PATTERN}} design pattern. Provide the refactored code:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'securityAudit',
    name: 'Security Audit',
    description: 'Audit code for security vulnerabilities',
    shortDescription: 'Audit code security',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Perform a security audit on the following code. Identify potential vulnerabilities and suggest fixes:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'addDocumentation',
    name: 'Add Documentation',
    description: 'Add comments and documentation to code',
    shortDescription: 'Add code documentation',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Add comprehensive comments and documentation to the following code. Include function/class descriptions, parameter explanations, and usage examples:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
  {
    id: 'generateTests',
    name: 'Generate Tests',
    description: 'Generate unit tests for the code',
    shortDescription: 'Generate unit tests',
    category: 'code',
    icon: 'Code',
    variables: ['SELECTION', 'LANGUAGE'],
    defaultPrompt: {
      user: `Generate comprehensive unit tests for the following code. Use appropriate testing framework for {{LANGUAGE}}:

\`\`\`{{LANGUAGE}}
{{SELECTION}}
\`\`\``,
    },
  },
]

export function getDefaultPromptContent(commandId: CommandId): PromptContent {
  const command = commandDefinitions.find((c) => c.id === commandId)
  return command?.defaultPrompt || { user: '{{SELECTION}}' }
}

export function getDefaultSystemPrompt(): string {
  return defaultSystemPrompt
}

export function getCommandDefinition(commandId: CommandId): CommandDefinition | undefined {
  return commandDefinitions.find((c) => c.id === commandId)
}

export function getCommandsByCategory(category: 'text' | 'content' | 'code'): CommandDefinition[] {
  return commandDefinitions.filter((c) => c.category === category)
}
