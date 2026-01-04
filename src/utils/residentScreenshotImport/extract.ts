/**
 * Simplified OCR resident extraction.
 *
 * This module consolidates the OCR parsing logic into a single, readable pipeline:
 * 1. Group OCR lines into rows by y-position
 * 2. For each row, identify name + job text
 * 3. Match job text to known stores
 * 4. Deduplicate candidates by name
 */

import type { Store } from '@/types'
import type { OcrLine, ScreenshotResidentCandidate } from './types'

// ============================================================================
// Text Utilities (minimal set needed for extraction)
// ============================================================================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeNoSpace(s: string): string {
  return normalize(s).replace(/\s+/g, '')
}

function isUnemployed(text: string): boolean {
  const t = normalizeNoSpace(text)
  return t === 'unemployed' || t.includes('unemploy') || t.includes('nemploy')
}

function isNoise(text: string): boolean {
  const t = normalize(text)
  if (!t) return true
  if (t.includes('dream job') || t === 'job') return true
  if (/^[0-9\s]+$/.test(t)) return true
  return false
}

function isValidName(text: string): boolean {
  const cleaned = text
    .replace(/[^a-zA-Z\s'-]/g, '')
    .replace(/\s+\d+$/, '')
    .trim()
  if (!cleaned || cleaned.length < 3) return false
  if (isUnemployed(cleaned)) return false
  if (/\d/.test(cleaned)) return false
  if (!cleaned.includes(' ') && cleaned.length < 6) return false
  return true
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function similarity(a: string, b: string): number {
  const an = normalizeNoSpace(a)
  const bn = normalizeNoSpace(b)
  if (!an || !bn) return 0
  return 1 - levenshtein(an, bn) / Math.max(an.length, bn.length)
}

// ============================================================================
// Store Matching
// ============================================================================

interface StoreMatch {
  store: Store
  confidence: number
  startIndex: number // Where the store name was found in the text
}

/** Build a lookup index for efficient store matching */
function buildStoreIndex(stores: Store[]) {
  const byNormalized = new Map<string, Store>()
  const byNoSpace = new Map<string, Store>()

  for (const store of stores) {
    byNormalized.set(normalize(store.name), store)
    byNoSpace.set(normalizeNoSpace(store.name), store)
  }

  return { byNormalized, byNoSpace, stores }
}

/** Find all stores mentioned in a text, in order of appearance */
function findStoresInText(text: string, index: ReturnType<typeof buildStoreIndex>): StoreMatch[] {
  const results: StoreMatch[] = []
  const textNorm = normalizeNoSpace(text)

  // First pass: find exact substring matches
  for (const store of index.stores) {
    const storeNorm = normalizeNoSpace(store.name)
    if (!storeNorm) continue

    // Find ALL occurrences of this store in the text
    let searchStart = 0
    while (searchStart < textNorm.length) {
      const idx = textNorm.indexOf(storeNorm, searchStart)
      if (idx < 0) break
      results.push({ store, confidence: 0.95, startIndex: idx })
      searchStart = idx + storeNorm.length
    }
  }

  // Second pass: check for suffix matches in remaining text
  // This handles OCR truncation like "EDDING CHAPEL" -> "WEDDING CHAPEL"
  if (results.length > 0) {
    // Sort by position to find the last matched store
    results.sort((a, b) => a.startIndex - b.startIndex)
    const lastMatch = results[results.length - 1]
    const lastStoreNorm = normalizeNoSpace(lastMatch.store.name)
    const afterLastStore = textNorm.slice(lastMatch.startIndex + lastStoreNorm.length)

    if (afterLastStore.length >= 5) {
      // Try to match the remaining text as a suffix of a store name
      for (const store of index.stores) {
        const storeNorm = normalizeNoSpace(store.name)
        // Check if remaining text is a suffix of this store (1-3 chars truncated)
        if (storeNorm.length > afterLastStore.length) {
          const truncated = storeNorm.length - afterLastStore.length
          if (truncated <= 3 && storeNorm.endsWith(afterLastStore)) {
            const conf = 0.88 - truncated * 0.03
            results.push({
              store,
              confidence: conf,
              startIndex: lastMatch.startIndex + lastStoreNorm.length,
            })
            break // Found a suffix match, stop searching
          }
        }
      }
    }
  }

  // Sort by where they appear in the text
  results.sort((a, b) => a.startIndex - b.startIndex)
  return results
}

/** Try to match a single text to a store with fuzzy matching */
function matchSingleStore(
  text: string,
  index: ReturnType<typeof buildStoreIndex>
): StoreMatch | undefined {
  const trimmed = text.trim()
  if (!trimmed || isUnemployed(trimmed)) return undefined

  const textNorm = normalize(trimmed)
  const textNoSpace = normalizeNoSpace(trimmed)

  // Exact match (normalized)
  const exactMatch = index.byNormalized.get(textNorm)
  if (exactMatch) return { store: exactMatch, confidence: 1.0, startIndex: 0 }

  // No-space exact match
  const noSpaceMatch = index.byNoSpace.get(textNoSpace)
  if (noSpaceMatch) return { store: noSpaceMatch, confidence: 0.98, startIndex: 0 }

  // Suffix match - handle OCR truncation where beginning of store name is cut off
  // e.g., "EDDING CHAPEL" should match "WEDDING CHAPEL"
  for (const store of index.stores) {
    const storeNoSpace = normalizeNoSpace(store.name)
    // Check if the text is a suffix of the store name (allowing 1-3 chars truncated)
    if (storeNoSpace.length > textNoSpace.length) {
      const truncated = storeNoSpace.length - textNoSpace.length
      if (truncated <= 3 && storeNoSpace.endsWith(textNoSpace)) {
        // Confidence based on how much was truncated
        const conf = 0.9 - truncated * 0.03
        return { store, confidence: conf, startIndex: 0 }
      }
    }
  }

  // Fuzzy match - find best similarity
  let best: { store: Store; score: number } | undefined
  for (const store of index.stores) {
    const score = similarity(trimmed, store.name)
    if (!best || score > best.score) {
      best = { store, score }
    }
  }

  if (best && best.score >= 0.75) {
    return { store: best.store, confidence: best.score, startIndex: 0 }
  }

  return undefined
}

// ============================================================================
// Row Grouping
// ============================================================================

interface Row {
  y0: number
  lines: OcrLine[]
}

/** Group OCR lines into rows based on y-position clustering */
function groupIntoRows(lines: OcrLine[]): Row[] {
  const sorted = [...lines].filter(l => l.text.trim() && !isNoise(l.text))
  sorted.sort((a, b) => a.bbox.y0 - b.bbox.y0)

  // Calculate median line height for clustering threshold
  const heights = sorted
    .map(l => l.bbox.y1 - l.bbox.y0)
    .filter(h => h > 0)
    .sort((a, b) => a - b)
  const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 30
  const threshold = Math.max(26, medianHeight * 1.6)

  const rows: Row[] = []
  for (const line of sorted) {
    const last = rows[rows.length - 1]
    if (last && Math.abs(line.bbox.y0 - last.y0) <= threshold) {
      last.lines.push(line)
    } else {
      rows.push({ y0: line.bbox.y0, lines: [line] })
    }
  }
  return rows
}

// ============================================================================
// Candidate Extraction
// ============================================================================

/** Pick the best name from a list of texts */
function pickName(
  texts: string[],
  storeIndex: ReturnType<typeof buildStoreIndex>
): string | undefined {
  for (const text of texts) {
    const cleaned = text
      .replace(/\s+\d{3,}\s*$/, '') // Remove trailing numeric IDs
      .replace(/[^a-zA-Z\s'-]/g, ' ') // Keep only letters, spaces, apostrophe, hyphen
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()

    if (!isValidName(cleaned)) continue

    // Skip if it looks like a store name
    const storeMatch = matchSingleStore(cleaned, storeIndex)
    if (storeMatch && storeMatch.confidence >= 0.85) continue

    // Skip if it starts with a store name (job line, not name)
    const embedded = findStoresInText(text, storeIndex)
    if (embedded.length > 0 && embedded[0].startIndex === 0) continue

    return cleaned
  }
  return undefined
}

/** Extract a single candidate from a row */
function extractFromRow(
  row: Row,
  inferredWidth: number,
  storeIndex: ReturnType<typeof buildStoreIndex>,
  sourceFileName: string
): ScreenshotResidentCandidate | undefined {
  if (row.lines.length === 0) return undefined

  // Sort lines by x position to determine columns
  const sortedLines = [...row.lines].sort((a, b) => a.bbox.x0 - b.bbox.x0)

  // Determine column boundaries based on gaps in x positions
  const xs = sortedLines.map(l => l.bbox.x0)
  const gaps: Array<{ idx: number; gap: number }> = []
  for (let i = 1; i < xs.length; i++) {
    gaps.push({ idx: i, gap: xs[i] - xs[i - 1] })
  }

  const gapThreshold = Math.max(70, inferredWidth * 0.12)
  const bigGaps = gaps.filter(g => g.gap >= gapThreshold).sort((a, b) => b.gap - a.gap)

  // Split into columns
  let leftLines: OcrLine[] = sortedLines
  let middleLines: OcrLine[] = []
  let rightLines: OcrLine[] = []

  if (bigGaps.length >= 2) {
    // Three columns
    const split1Idx = Math.min(bigGaps[0].idx, bigGaps[1].idx)
    const split2Idx = Math.max(bigGaps[0].idx, bigGaps[1].idx)
    const split1 = (xs[split1Idx - 1] + xs[split1Idx]) / 2
    const split2 = (xs[split2Idx - 1] + xs[split2Idx]) / 2

    leftLines = sortedLines.filter(l => l.bbox.x0 < split1)
    middleLines = sortedLines.filter(l => l.bbox.x0 >= split1 && l.bbox.x0 < split2)
    rightLines = sortedLines.filter(l => l.bbox.x0 >= split2)
  } else if (bigGaps.length === 1) {
    // Two columns
    const splitIdx = bigGaps[0].idx
    const split = (xs[splitIdx - 1] + xs[splitIdx]) / 2
    leftLines = sortedLines.filter(l => l.bbox.x0 < split)
    rightLines = sortedLines.filter(l => l.bbox.x0 >= split)
  }

  const leftTexts = leftLines.map(l => l.text.trim())
  const middleTexts = middleLines.map(l => l.text.trim())
  const rightTexts = rightLines.map(l => l.text.trim())

  // Find name (should be in left column)
  const name = pickName(leftTexts, storeIndex)
  if (!name) return undefined

  // Get non-name texts from left column for embedded job detection
  const nameNorm = normalizeNoSpace(name)
  const leftJobTexts = leftTexts.filter(t => normalizeNoSpace(t) !== nameNorm)

  // Try to extract jobs from column layout (middle=current, right=dream)
  let currentStoreId: string | undefined
  let currentStoreName: string | undefined
  let currentRaw: string | undefined
  let currentConfidence = 0
  let dreamStoreId: string | undefined
  let dreamStoreName: string | undefined
  let dreamRaw: string | undefined
  let dreamConfidence = 0

  // Check middle column for current job (3-column layout)
  for (const text of middleTexts) {
    if (isUnemployed(text)) {
      currentRaw = 'UNEMPLOYED'
      continue
    }
    const match = matchSingleStore(text, storeIndex)
    if (match && match.confidence > currentConfidence) {
      currentStoreId = match.store.id
      currentStoreName = match.store.name
      currentRaw = text
      currentConfidence = match.confidence
    }
  }

  // Check right column for dream job (may contain embedded "STORE STORE" pattern)
  for (const text of rightTexts) {
    // First check for embedded stores (handles "CAKE STUDIO CAKE STUDIO")
    const embedded = findStoresInText(text, storeIndex)
    if (embedded.length >= 2) {
      // Two stores: first is current, last is dream
      if (!currentStoreId && currentRaw !== 'UNEMPLOYED') {
        currentStoreId = embedded[0].store.id
        currentStoreName = embedded[0].store.name
        currentRaw = text
        currentConfidence = embedded[0].confidence
      }
      if (!dreamStoreId || embedded[embedded.length - 1].confidence > dreamConfidence) {
        dreamStoreId = embedded[embedded.length - 1].store.id
        dreamStoreName = embedded[embedded.length - 1].store.name
        dreamRaw = text
        dreamConfidence = embedded[embedded.length - 1].confidence
      }
    } else {
      // Single store match
      const match = matchSingleStore(text, storeIndex)
      if (match && match.confidence > dreamConfidence) {
        dreamStoreId = match.store.id
        dreamStoreName = match.store.name
        dreamRaw = text
        dreamConfidence = match.confidence
      }
    }
  }

  // Check left column non-name texts for current job (2-column layout) or embedded jobs
  if (leftJobTexts.length > 0) {
    // Check for unemployed in left column
    if (leftJobTexts.some(t => isUnemployed(t))) {
      currentRaw = 'UNEMPLOYED'
    }

    // In 2-column layout, left job texts are current job candidates
    if (middleTexts.length === 0 && !currentStoreId) {
      for (const text of leftJobTexts) {
        if (isUnemployed(text)) continue
        const match = matchSingleStore(text, storeIndex)
        if (match && match.confidence > currentConfidence) {
          currentStoreId = match.store.id
          currentStoreName = match.store.name
          currentRaw = text
          currentConfidence = match.confidence
        }
      }
    }

    // Also check for embedded stores (handles mashed job lines like "STORE1 STORE2")
    if (!currentStoreId || !dreamStoreId) {
      const combined = leftJobTexts.join(' ')
      const embedded = findStoresInText(combined, storeIndex)

      if (embedded.length >= 2) {
        // Two stores: first is current, last is dream
        if (!currentStoreId && currentRaw !== 'UNEMPLOYED') {
          currentStoreId = embedded[0].store.id
          currentStoreName = embedded[0].store.name
          currentConfidence = embedded[0].confidence
        }
        if (!dreamStoreId) {
          dreamStoreId = embedded[embedded.length - 1].store.id
          dreamStoreName = embedded[embedded.length - 1].store.name
          dreamRaw = embedded[embedded.length - 1].store.name
          dreamConfidence = embedded[embedded.length - 1].confidence
        }
      } else if (embedded.length === 1) {
        const store = embedded[0]
        const textAfter = normalizeNoSpace(combined).slice(
          store.startIndex + normalizeNoSpace(store.store.name).length
        )

        if (currentRaw === 'UNEMPLOYED') {
          // If unemployed, the single store is the dream job
          if (!dreamStoreId) {
            dreamStoreId = store.store.id
            dreamStoreName = store.store.name
            dreamRaw = store.store.name
            dreamConfidence = store.confidence
          }
        } else if (store.startIndex === 0 && textAfter.length >= 5) {
          // Store at start with corrupted text after = current job
          if (!currentStoreId) {
            currentStoreId = store.store.id
            currentStoreName = store.store.name
            currentConfidence = store.confidence
          }
        }
        // Note: We don't assign single stores as dream here because
        // they should come from the right column in a proper layout
      }
    }
  }

  // If we still have no dream raw, use leftover job texts
  if (!dreamRaw && leftJobTexts.length > 0) {
    dreamRaw = leftJobTexts.filter(t => !isUnemployed(t)).sort((a, b) => b.length - a.length)[0]
  }

  const issues: string[] = []
  if (!dreamStoreId) {
    if (!dreamRaw) issues.push('Dream job could not be parsed')
    issues.push('Could not confidently match dream job to a known store')
  }
  if (currentRaw && !currentStoreId && !isUnemployed(currentRaw)) {
    issues.push('Could not confidently match current job to a known store')
  }

  return {
    nameRaw: name,
    name,
    currentJobRaw: currentRaw,
    currentJobStoreId: currentStoreId,
    matchedCurrentStoreName: currentStoreName,
    currentMatchConfidence: currentConfidence,
    dreamJobRaw: dreamRaw ?? '',
    dreamJobStoreId: dreamStoreId,
    matchedStoreName: dreamStoreName,
    matchConfidence: dreamConfidence,
    selected: Boolean(dreamStoreId && dreamConfidence >= 0.75),
    issues,
    sourceFileName,
  }
}

// ============================================================================
// Deduplication
// ============================================================================

/** Simple deduplication: group by name, keep best candidate, merge info */
function deduplicateCandidates(
  candidates: ScreenshotResidentCandidate[]
): ScreenshotResidentCandidate[] {
  const byName = new Map<string, ScreenshotResidentCandidate>()

  for (const c of candidates) {
    const key = normalizeNoSpace(c.name)
    const existing = byName.get(key)

    if (!existing) {
      byName.set(key, { ...c })
      continue
    }

    // Merge: prefer more complete info
    if (!existing.dreamJobStoreId && c.dreamJobStoreId) {
      existing.dreamJobStoreId = c.dreamJobStoreId
      existing.matchedStoreName = c.matchedStoreName
      existing.matchConfidence = c.matchConfidence
      existing.dreamJobRaw = c.dreamJobRaw
    }
    if (!existing.currentJobStoreId && c.currentJobStoreId) {
      existing.currentJobStoreId = c.currentJobStoreId
      existing.matchedCurrentStoreName = c.matchedCurrentStoreName
      existing.currentMatchConfidence = c.currentMatchConfidence
      existing.currentJobRaw = c.currentJobRaw
    }
    if (!existing.currentJobRaw && c.currentJobRaw) {
      existing.currentJobRaw = c.currentJobRaw
    }
    if (!existing.dreamJobRaw && c.dreamJobRaw) {
      existing.dreamJobRaw = c.dreamJobRaw
    }

    // Prefer fewer issues
    if ((c.issues?.length ?? 0) < (existing.issues?.length ?? 0)) {
      existing.issues = c.issues
    }

    // Update selected status
    existing.selected = existing.selected || c.selected
  }

  return Array.from(byName.values())
}

// ============================================================================
// Main Export
// ============================================================================

export function extractCandidates(params: {
  lines: OcrLine[]
  inferredWidth: number
  stores: Store[]
  sourceFileName: string
}): ScreenshotResidentCandidate[] {
  const { lines, inferredWidth, stores, sourceFileName } = params

  const storeIndex = buildStoreIndex(stores)
  const rows = groupIntoRows(lines)

  const candidates: ScreenshotResidentCandidate[] = []
  for (const row of rows) {
    const candidate = extractFromRow(row, inferredWidth, storeIndex, sourceFileName)
    if (candidate) candidates.push(candidate)
  }

  return deduplicateCandidates(candidates)
}
