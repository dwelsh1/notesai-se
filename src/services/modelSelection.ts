import { loadConfig } from '../config/appConfig'
import { checkAIConnection } from './aiConnection'
import {
  autoSelectCodingModel,
  autoSelectChatModel,
  autoSelectEmbeddingModel,
} from './modelDetection'

/**
 * Gets the appropriate model for a given use case, handling auto-selection
 */
export async function getModelForUseCase(
  useCase: 'general' | 'code' | 'chat' | 'embedding',
): Promise<string> {
  const config = loadConfig()

  if (!config.aiEnabled) {
    throw new Error('AI features are disabled. Enable them in Settings > AI Settings > General.')
  }

  // Check if we have a specific model configured for this use case
  if (useCase === 'code' && config.aiCodeModel) {
    return config.aiCodeModel
  }
  if (useCase === 'chat' && config.aiChatModel) {
    return config.aiChatModel
  }
  if (useCase === 'embedding' && config.aiEmbeddingModel) {
    return config.aiEmbeddingModel
  }

  // If general use case or no specific model, use default model
  if (config.aiModel) {
    return config.aiModel
  }

  // Auto-select: need to fetch available models
  try {
    const connectionResult = await checkAIConnection(config.aiEndpoint, '', true)
    if (connectionResult.status !== 'connected' || connectionResult.models.length === 0) {
      throw new Error('No models available. Please check your LM Studio connection.')
    }

    const availableModels = connectionResult.models

    // Auto-select based on use case
    if (useCase === 'code') {
      const autoSelected = autoSelectCodingModel(availableModels)
      if (autoSelected) return autoSelected
    } else if (useCase === 'chat') {
      const autoSelected = autoSelectChatModel(availableModels)
      if (autoSelected) return autoSelected
    } else if (useCase === 'embedding') {
      const autoSelected = autoSelectEmbeddingModel(availableModels)
      if (autoSelected) return autoSelected
    }

    // Fallback: use first available model
    return availableModels[0]
  } catch (error) {
    throw new Error(
      `Failed to auto-select model: ${error instanceof Error ? error.message : 'Unknown error'}. Please configure a model in Settings > AI Settings > General.`,
    )
  }
}

/**
 * Gets the temperature setting, respecting maxTokens if needed
 */
export function getTemperature(): number {
  const config = loadConfig()
  return config.aiTemperature
}

/**
 * Gets the max tokens setting
 */
export function getMaxTokens(): number {
  const config = loadConfig()
  return config.aiMaxTokens
}

/**
 * Checks if AI features are enabled
 */
export function isAiEnabled(): boolean {
  const config = loadConfig()
  return config.aiEnabled
}
