import { describe, it, expect } from 'vitest'
import { cosineSimilarity, normalizeSimilarity } from './vectorMath'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const a = [1, 2, 3]
    expect(cosineSimilarity(a, [...a])).toBe(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBe(-1)
  })

  it('returns value in [-1, 1] for normalized-like vectors', () => {
    const sim = cosineSimilarity([0.5, 0.5, 0], [0.5, 0, 0.5])
    expect(sim).toBeGreaterThanOrEqual(-1)
    expect(sim).toBeLessThanOrEqual(1)
  })

  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vector length mismatch')
  })
})

describe('normalizeSimilarity', () => {
  it('clamps to [0, 1]', () => {
    expect(normalizeSimilarity(1)).toBe(1)
    expect(normalizeSimilarity(-1)).toBe(0)
    expect(normalizeSimilarity(0)).toBe(0.5)
  })

  it('maps 0.5 cosine to ~0.75', () => {
    const n = normalizeSimilarity(0.5)
    expect(n).toBeGreaterThan(0.7)
    expect(n).toBeLessThan(0.8)
  })
})
