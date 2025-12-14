import type { Store } from '@/types'
import { matchStore } from './storeMatching'
import {
  extractResidentNameFromOcrLine,
  isLikelyName,
  isUnemployedText,
  sanitizeResidentName,
} from './textUtils'

export function pickBestName(
  texts: string[],
  stores?: Store[]
): { raw: string; name: string } | undefined {
  const candidates = texts
    .map(raw => {
      const trimmed = raw.trim()
      const extracted = extractResidentNameFromOcrLine(trimmed, stores)
      return { raw: trimmed, name: extracted || sanitizeResidentName(trimmed) }
    })
    .filter(c => isLikelyName(c.name))
    .filter(c => !isUnemployedText(c.raw) && !isUnemployedText(c.name))
    .filter(c => {
      if (!stores) return true
      const storeMatch = matchStore(c.name, stores)
      return !(storeMatch.storeId && storeMatch.confidence >= 0.85)
    })
    .sort((a, b) => b.name.length - a.name.length)
  return candidates[0]
}
