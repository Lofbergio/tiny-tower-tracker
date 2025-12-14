import type { Store } from '@/types'
import type { ScreenshotResidentCandidate, TesseractLine } from '../types'
import { AUTO_SELECT_MIN_CONFIDENCE } from '../constants'
import { matchStore } from '../storeMatching'
import {
  extractResidentNameFromOcrLine,
  isLikelyName,
  isLikelyStoreName,
  looksLikeHeaderOrNoise,
  sanitizeResidentName,
} from '../textUtils'

export function extractCandidatesVerticalPair(params: {
  lines: TesseractLine[]
  inferredWidth: number
  stores: Store[]
  sourceFileName: string
}): ScreenshotResidentCandidate[] {
  const { lines, inferredWidth, stores, sourceFileName } = params

  const leftThreshold = inferredWidth * 0.6

  const leftLines = lines
    .filter(l => !looksLikeHeaderOrNoise(l.text))
    .filter(l => l.bbox.x0 < leftThreshold)
    .sort((a, b) => a.bbox.y0 - b.bbox.y0)

  const out: ScreenshotResidentCandidate[] = []
  let pendingName: { text: string; y0: number } | undefined

  for (const line of leftLines) {
    const raw = line.text.trim()
    if (!raw) continue

    if (!pendingName) {
      const extracted = extractResidentNameFromOcrLine(raw, stores)
      if (extracted && isLikelyName(extracted)) {
        const storeLike = matchStore(extracted, stores)
        if (storeLike.storeId && storeLike.confidence >= 0.92) {
          continue
        }
        pendingName = { text: extracted, y0: line.bbox.y0 }
      }
      continue
    }

    const verticalGap = line.bbox.y0 - pendingName.y0
    if (verticalGap < 0) {
      pendingName = undefined
      continue
    }

    if (verticalGap > 80) {
      const extracted = extractResidentNameFromOcrLine(raw, stores)
      pendingName = extracted && isLikelyName(extracted) ? { text: extracted, y0: line.bbox.y0 } : undefined
      continue
    }

    if (!isLikelyStoreName(raw)) {
      continue
    }

    const name = sanitizeResidentName(pendingName.text)
    const dreamJobRaw = raw
    const match = matchStore(dreamJobRaw, stores)

    const issues: string[] = []
    if (!name) {
      issues.push('Name could not be parsed')
    }
    if (!dreamJobRaw) {
      issues.push('Dream job could not be parsed')
    }
    if (!match.storeId) {
      issues.push('Could not confidently match dream job to a known store')
    }

    out.push({
      nameRaw: pendingName.text,
      dreamJobRaw,
      name,
      dreamJobStoreId: match.storeId,
      matchedStoreName: match.storeName,
      matchConfidence: match.confidence,
      selected: Boolean(name) && Boolean(match.storeId) && match.confidence >= AUTO_SELECT_MIN_CONFIDENCE,
      issues,
      sourceFileName,
    })

    pendingName = undefined
  }

  return out
}
