import type { Store } from '@/types'
import {
  collapseImmediateDuplicateNoSpace,
  isLikelyStoreName,
  isUnemployedText,
  normalizeForMatch,
  normalizeForNoSpaceMatch,
  similarity,
  similarityNoSpace,
} from './textUtils'

export function matchStore(
  dreamJobRaw: string,
  stores: Store[]
): {
  storeId?: string
  storeName?: string
  confidence: number
} {
  const raw = dreamJobRaw.trim()
  if (!raw) return { confidence: 0 }
  if (isUnemployedText(raw)) return { confidence: 0 }

  const collapsedNoSpace = collapseImmediateDuplicateNoSpace(raw)
  const rawNoSpace = normalizeForNoSpaceMatch(raw)

  const exact = stores.find(s => s.name.toLowerCase() === raw.toLowerCase())
  if (exact) return { storeId: exact.id, storeName: exact.name, confidence: 1 }

  const normalizedRaw = normalizeForMatch(raw)
  const normalizedExact = stores.find(s => normalizeForMatch(s.name) === normalizedRaw)
  if (normalizedExact) {
    return { storeId: normalizedExact.id, storeName: normalizedExact.name, confidence: 0.98 }
  }

  if (rawNoSpace) {
    const noSpaceExact = stores.find(s => normalizeForNoSpaceMatch(s.name) === rawNoSpace)
    if (noSpaceExact) {
      return { storeId: noSpaceExact.id, storeName: noSpaceExact.name, confidence: 0.98 }
    }
  }

  if (collapsedNoSpace) {
    const collapsedExact = stores.find(s => normalizeForNoSpaceMatch(s.name) === collapsedNoSpace)
    if (collapsedExact) {
      return { storeId: collapsedExact.id, storeName: collapsedExact.name, confidence: 0.98 }
    }
  }

  let best: { store: Store; score: number } | undefined
  let second: { store: Store; score: number } | undefined
  for (const store of stores) {
    const score = Math.max(
      similarity(raw, store.name),
      similarityNoSpace(raw, store.name),
      collapsedNoSpace ? similarityNoSpace(collapsedNoSpace, store.name) : 0
    )
    if (!best || score > best.score) {
      second = best
      best = { store, score }
      continue
    }

    if (!second || score > second.score) {
      second = { store, score }
    }
  }

  if (!best) return { confidence: 0 }

  if (best.score < 0.75) {
    const rawNorm = normalizeForMatch(raw)
    const isShort = rawNorm.length > 0 && rawNorm.length <= 4
    if (!isShort) {
      return { confidence: best.score }
    }

    if (second) {
      const gap = best.score - second.score
      if (best.score >= 0.33 && gap >= 0.12) {
        return { storeId: best.store.id, storeName: best.store.name, confidence: best.score }
      }
    } else if (best.score >= 0.33) {
      return { storeId: best.store.id, storeName: best.store.name, confidence: best.score }
    }

    return { confidence: best.score }
  }

  if (second && second.score >= 0.75) {
    const gap = best.score - second.score
    if (gap < 0.05) {
      return { confidence: best.score }
    }
  }

  return { storeId: best.store.id, storeName: best.store.name, confidence: best.score }
}

export function pickBestStoreMatch(
  rawTexts: string[],
  stores: Store[]
): { raw?: string; storeId?: string; storeName?: string; confidence: number } {
  let best: { raw?: string; storeId?: string; storeName?: string; confidence: number } = {
    confidence: 0,
  }

  for (const raw of rawTexts) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (!isLikelyStoreName(trimmed)) continue

    const match = matchStore(trimmed, stores)
    if (match.confidence > best.confidence) {
      best = {
        raw: trimmed,
        storeId: match.storeId,
        storeName: match.storeName,
        confidence: match.confidence,
      }
    }
  }

  return best
}

export function findEmbeddedStoresInText(
  text: string,
  stores: Store[]
): Array<{ store: Store; index: number }> {
  const hay = normalizeForNoSpaceMatch(text)
  if (!hay) return []

  const hits: Array<{ store: Store; index: number }> = []
  for (const store of stores) {
    const needle = normalizeForNoSpaceMatch(store.name)
    if (!needle || needle.length < 4) continue
    const idx = hay.indexOf(needle)
    if (idx >= 0) {
      hits.push({ store, index: idx })
    }
  }

  hits.sort((a, b) => a.index - b.index)
  const seen = new Set<string>()
  const out: Array<{ store: Store; index: number }> = []
  for (const h of hits) {
    if (seen.has(h.store.id)) continue
    seen.add(h.store.id)
    out.push(h)
  }
  return out
}
