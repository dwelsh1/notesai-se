/**
 * Detects if a model is suitable for coding tasks
 */
export function isCodingModel(modelName: string): boolean {
  const name = modelName.toLowerCase()
  return (
    name.includes('coder') ||
    name.includes('code') ||
    name.includes('qwen3') ||
    name.includes('starcoder') ||
    name.includes('wizardcoder') ||
    name.includes('deepseek-coder')
  )
}

/**
 * Detects if a model is suitable for chat/conversation
 */
export function isChatModel(modelName: string): boolean {
  const name = modelName.toLowerCase()
  return (
    name.includes('instruct') ||
    name.includes('chat') ||
    name.includes('llama') ||
    name.includes('mistral') ||
    name.includes('phi')
  )
}

/**
 * Detects if a model is suitable for embeddings
 */
export function isEmbeddingModel(modelName: string): boolean {
  const name = modelName.toLowerCase()
  return (
    name.includes('embed') || name.includes('nomic') || name.includes('bge') || name.includes('e5')
  )
}

/**
 * Filters models to only coding-capable ones
 */
export function getCodingModels(models: string[]): string[] {
  return models.filter(isCodingModel)
}

/**
 * Filters models to only chat-capable ones
 */
export function getChatModels(models: string[]): string[] {
  return models.filter(isChatModel)
}

/**
 * Filters models to only embedding-capable ones
 */
export function getEmbeddingModels(models: string[]): string[] {
  return models.filter(isEmbeddingModel)
}

/**
 * Auto-selects best coding model from list
 */
export function autoSelectCodingModel(models: string[]): string {
  const codingModels = getCodingModels(models)
  if (codingModels.length === 0) return ''

  // Prefer Qwen3 Coder
  const qwen3 = codingModels.find((m) => m.toLowerCase().includes('qwen3'))
  if (qwen3) return qwen3

  // Otherwise return first coding model
  return codingModels[0]
}

/**
 * Auto-selects best chat model from list
 */
export function autoSelectChatModel(models: string[]): string {
  const chatModels = getChatModels(models)
  if (chatModels.length === 0) return ''

  // Prefer instruct models
  const instruct = chatModels.find((m) => m.toLowerCase().includes('instruct'))
  if (instruct) return instruct

  // Otherwise return first chat model
  return chatModels[0]
}

/**
 * Auto-selects best embedding model from list
 */
export function autoSelectEmbeddingModel(models: string[]): string {
  const embeddingModels = getEmbeddingModels(models)
  if (embeddingModels.length === 0) return ''

  // Prefer nomic-embed
  const nomic = embeddingModels.find((m) => m.toLowerCase().includes('nomic'))
  if (nomic) return nomic

  // Otherwise return first embedding model
  return embeddingModels[0]
}
