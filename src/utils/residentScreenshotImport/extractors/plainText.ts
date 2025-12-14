import type { Store } from '@/types'
import { AUTO_SELECT_MIN_CONFIDENCE } from '../constants'
import { pickBestName } from '../namePicking'
import { findEmbeddedStoresInText, matchStore } from '../storeMatching'
import {
  isLikelyName,
  isLikelyStoreName,
  looksLikeHeaderOrNoise,
  sanitizeResidentName,
} from '../textUtils'
import type { ScreenshotResidentCandidate } from '../types'

export function extractCandidatesFromPlainText(params: {
  text: string
  stores: Store[]
  sourceFileName: string
}): ScreenshotResidentCandidate[] {
  const { text, stores, sourceFileName } = params
  const rawLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  const out: ScreenshotResidentCandidate[] = []
  let pendingName: string | undefined

  for (const raw of rawLines) {
    if (looksLikeHeaderOrNoise(raw)) continue

    const extractedName = pickBestName([raw], stores)?.name
    if (extractedName && isLikelyName(extractedName)) {
      const embedded = findEmbeddedStoresInText(raw, stores)
      if (embedded.length > 0) {
        const name = extractedName
        const dreamStore = embedded[embedded.length - 1]
        const currentStore = embedded.length > 1 ? embedded[0] : undefined
        const hasUnemployed = /\bunemployed\b/i.test(raw)
        out.push({
          nameRaw: raw,
          dreamJobRaw: dreamStore.store.name,
          currentJobRaw: hasUnemployed ? 'UNEMPLOYED' : currentStore?.store.name,
          name,
          dreamJobStoreId: dreamStore.store.id,
          currentJobStoreId: hasUnemployed ? undefined : currentStore?.store.id,
          matchedStoreName: dreamStore.store.name,
          matchedCurrentStoreName: hasUnemployed ? undefined : currentStore?.store.name,
          matchConfidence: 0.9,
          currentMatchConfidence: !hasUnemployed && currentStore ? 0.9 : undefined,
          selected:
            Boolean(name) && Boolean(dreamStore.store.id) && 0.9 >= AUTO_SELECT_MIN_CONFIDENCE,
          issues: [],
          sourceFileName,
        })
        pendingName = undefined
        continue
      }

      pendingName = extractedName
      continue
    }

    if (!pendingName) continue
    if (!isLikelyStoreName(raw)) continue

    const name = sanitizeResidentName(pendingName)
    const match = matchStore(raw, stores)

    const issues: string[] = []
    if (!name) issues.push('Name could not be parsed')
    if (!match.storeId) issues.push('Could not confidently match dream job to a known store')

    out.push({
      nameRaw: pendingName,
      dreamJobRaw: raw,
      name,
      dreamJobStoreId: match.storeId,
      matchedStoreName: match.storeName,
      matchConfidence: match.confidence,
      selected:
        Boolean(name) && Boolean(match.storeId) && match.confidence >= AUTO_SELECT_MIN_CONFIDENCE,
      issues,
      sourceFileName,
    })

    pendingName = undefined
  }

  return out
}
