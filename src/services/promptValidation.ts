import type { CommandId } from './promptDefaults'
import { getCommandDefinition } from './promptDefaults'
import type { CustomPrompt } from '../config/appConfig'

export type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validatePrompt(commandId: CommandId, prompt: CustomPrompt): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const command = getCommandDefinition(commandId)
  if (!command) {
    errors.push(`Unknown command: ${commandId}`)
    return { isValid: false, errors, warnings }
  }

  // User prompt is required
  if (!prompt.user || !prompt.user.trim()) {
    errors.push('User prompt is required')
    return { isValid: false, errors, warnings }
  }

  // Check for required variables
  const userPromptText = prompt.user
  for (const variable of command.variables) {
    const variablePattern = new RegExp(`\\{\\{${variable}\\}\\}`, 'i')
    if (!variablePattern.test(userPromptText)) {
      warnings.push(`Variable {{${variable}}} is available but not used`)
    }
  }

  // Check for unknown variables
  const variableMatches = userPromptText.matchAll(/\{\{(\w+)\}\}/g)
  for (const match of variableMatches) {
    const variable = match[1]
    if (!command.variables.includes(variable)) {
      warnings.push(`Variable {{${variable}}} is not available for this command`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
