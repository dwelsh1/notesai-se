/**
 * Cosine similarity between two vectors of the same length.
 * Returns value in [-1, 1]; for normalized vectors typically [0, 1].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`)
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const mag = Math.sqrt(normA) * Math.sqrt(normB)
  if (mag === 0) return 0
  return dot / mag
}

/**
 * Clamp similarity to [0, 1] for display as percentage.
 * Cosine similarity can be in [-1, 1]; we map to 0-1 for relevance.
 */
export function normalizeSimilarity(similarity: number): number {
  return Math.max(0, Math.min(1, (similarity + 1) / 2))
}
