import type { Store } from '@/types'
import type { ScreenshotResidentCandidate, TesseractLine } from '../types'
import { AUTO_SELECT_MIN_CONFIDENCE } from '../constants'
import { groupLinesIntoRows, splitRowIntoColumns } from '../layout'
import { pickBestName } from '../namePicking'
import { findEmbeddedStoresInText, pickBestStoreMatch } from '../storeMatching'
import {
  isUnemployedText,
  looksLikeHeaderOrNoise,
  normalizeForMatch,
} from '../textUtils'

export function extractCandidatesThreeColumn(params: {
  lines: TesseractLine[]
  inferredWidth: number
  stores: Store[]
  sourceFileName: string
}): ScreenshotResidentCandidate[] {
  const { lines, inferredWidth, stores, sourceFileName } = params

  const relevant = lines
    .filter(l => !looksLikeHeaderOrNoise(l.text))
    .filter(l => l.text.trim() !== '')
  const rows = groupLinesIntoRows(relevant)

  const out: ScreenshotResidentCandidate[] = []

  for (const row of rows) {
    const cols = splitRowIntoColumns({ rowLines: row.lines, inferredWidth })
    if (cols.length < 2) continue

    const colTexts = cols.map(c => c.lines.map(l => l.text))

    let nameColIndex = 0
    let namePick = pickBestName(colTexts[0] ?? [], stores)
    for (let i = 1; i < colTexts.length; i++) {
      const pick = pickBestName(colTexts[i] ?? [], stores)
      if (pick && (!namePick || pick.name.length > namePick.name.length)) {
        namePick = pick
        nameColIndex = i
      }
    }
    if (!namePick) continue

    const nameColTexts = colTexts[nameColIndex] ?? []
    const nonNameInNameCol = nameColTexts.filter(
      t => normalizeForMatch(t) !== normalizeForMatch(namePick.raw)
    )

    const otherIndexes = cols.map((_, i) => i).filter(i => i !== nameColIndex)
    const dreamColIndex = otherIndexes.length ? otherIndexes[otherIndexes.length - 1] : -1
    const dreamColTexts = dreamColIndex >= 0 ? (colTexts[dreamColIndex] ?? []) : []

    const nonNameTrimmed = nonNameInNameCol.map(t => t.trim()).filter(Boolean)
    const hasUnemployed = nonNameTrimmed.some(t => isUnemployedText(t))
    const currentJobRaw = hasUnemployed
      ? 'UNEMPLOYED'
      : nonNameTrimmed.sort((a, b) => b.length - a.length)[0]

    const currentFromNameCol = pickBestStoreMatch(nonNameInNameCol, stores)
    const dreamFromDreamCol = pickBestStoreMatch(dreamColTexts, stores)

    const middleTexts = colTexts.length === 3 ? (colTexts[1] ?? []) : []
    const rightTexts = colTexts.length === 3 ? (colTexts[2] ?? []) : []
    const currentFromMiddle = middleTexts.length ? pickBestStoreMatch(middleTexts, stores) : { confidence: 0 }
    const dreamFromRight = rightTexts.length ? pickBestStoreMatch(rightTexts, stores) : { confidence: 0 }

    let currentMatch =
      currentFromNameCol.confidence >= 0.75
        ? currentFromNameCol
        : currentFromMiddle.confidence >= 0.75
          ? currentFromMiddle
          : currentFromNameCol

    let fallbackDream =
      dreamFromDreamCol.confidence > 0
        ? dreamFromDreamCol
        : dreamFromRight.confidence > 0
          ? dreamFromRight
          : { confidence: 0 }

    const rowText = row.lines.map(l => l.text).join(' ')
    const embedded = findEmbeddedStoresInText(rowText, stores)

    if (embedded.length > 0 && (!fallbackDream.storeId || fallbackDream.confidence < 0.75)) {
      const dream = embedded[embedded.length - 1]
      fallbackDream = {
        raw: dream.store.name,
        storeId: dream.store.id,
        storeName: dream.store.name,
        confidence: 0.9,
      }
    }

    if (embedded.length >= 2 && !hasUnemployed && (!currentMatch.storeId || currentMatch.confidence < 0.75)) {
      const current = embedded[0]
      currentMatch = {
        raw: current.store.name,
        storeId: current.store.id,
        storeName: current.store.name,
        confidence: 0.9,
      }
    }

    const issues: string[] = []

    if (!fallbackDream.raw) {
      issues.push('Dream job could not be parsed')
    } else if (!fallbackDream.storeId) {
      issues.push('Could not confidently match dream job to a known store')
    }

    if ((currentJobRaw ?? currentMatch.raw) && !currentMatch.storeId && !isUnemployedText(currentJobRaw ?? currentMatch.raw ?? '')) {
      issues.push('Could not confidently match current job to a known store')
    }

    out.push({
      nameRaw: namePick.raw,
      currentJobRaw: currentJobRaw ?? currentMatch.raw,
      dreamJobRaw: fallbackDream.raw ?? '',
      name: namePick.name,
      currentJobStoreId: currentMatch.storeId,
      dreamJobStoreId: fallbackDream.storeId,
      matchedCurrentStoreName: currentMatch.storeName,
      matchedStoreName: fallbackDream.storeName,
      currentMatchConfidence: currentMatch.confidence,
      matchConfidence: fallbackDream.confidence,
      selected: Boolean(namePick.name) && Boolean(fallbackDream.storeId) && fallbackDream.confidence >= AUTO_SELECT_MIN_CONFIDENCE,
      issues,
      sourceFileName,
    })
  }

  return out
}
