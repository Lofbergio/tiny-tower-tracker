import type { Store } from '@/types'
import type { PSM } from 'tesseract.js'
import { createWorker } from 'tesseract.js'

type TesseractBBox = { x0: number; y0: number; x1: number; y1: number }
type TesseractLine = { text: string; bbox: TesseractBBox }

export interface ScreenshotResidentCandidate {
  nameRaw: string
  currentJobRaw?: string
  dreamJobRaw: string
  name: string
  currentJobStoreId?: string
  dreamJobStoreId?: string
  matchedCurrentStoreName?: string
  matchedStoreName?: string
  currentMatchConfidence?: number // 0..1
  matchConfidence: number // 0..1
  selected: boolean
  issues: string[]
  sourceFileName: string
}

const AUTO_SELECT_MIN_CONFIDENCE = 0.85

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeForNoSpaceMatch(input: string): string {
  return normalizeForMatch(input).replace(/\s+/g, '')
}

function isUnemployedText(text: string): boolean {
  const t = normalizeForNoSpaceMatch(text)
  if (!t) return false
  if (t === 'unemployed') return true
  // Common OCR variants: UNEMFLOYED, LRNEMFLOYED, UMNEMFLOYED, etc.
  if (t.includes('unemploy') || t.includes('nemploy') || t.includes('employ')) return true
  // Fuzzy last resort.
  return similarityNoSpace(t, 'unemployed') >= 0.6
}

function stripTrailingNumericId(input: string): string {
  // Many screenshots show a numeric resident ID to the right; OCR sometimes appends it to the name.
  // Only strip if it's clearly an ID-like token (3+ digits) at the end.
  return input.replace(/\s+\d{3,}\s*$/, '').trim()
}

function sanitizeResidentName(input: string): string {
  // Keep only chars allowed by validation (letters/digits/spaces/'-)
  const cleaned = stripTrailingNumericId(
    input
      .replace(/[’]/g, "'")
      .replace(/[^a-zA-Z0-9\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )

  return cleaned
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return dp[a.length][b.length]
}

function similarity(a: string, b: string): number {
  const aa = normalizeForMatch(a)
  const bb = normalizeForMatch(b)
  if (!aa || !bb) return 0
  const dist = levenshteinDistance(aa, bb)
  const denom = Math.max(aa.length, bb.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

function similarityNoSpace(a: string, b: string): number {
  const aa = normalizeForNoSpaceMatch(a)
  const bb = normalizeForNoSpaceMatch(b)
  if (!aa || !bb) return 0
  const dist = levenshteinDistance(aa, bb)
  const denom = Math.max(aa.length, bb.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

function collapseImmediateDuplicateNoSpace(input: string): string | undefined {
  const noSpace = normalizeForNoSpaceMatch(input)
  if (noSpace.length < 8) return undefined
  if (noSpace.length % 2 !== 0) return undefined
  const half = noSpace.length / 2
  const a = noSpace.slice(0, half)
  const b = noSpace.slice(half)
  if (a === b) return a
  return undefined
}

function matchStore(
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

  // Fast exact matches
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

  // Fuzzy match
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

  // Heuristic threshold: below this we require manual fix
  if (best.score < 0.75) {
    const rawNorm = normalizeForMatch(raw)
    const isShort = rawNorm.length > 0 && rawNorm.length <= 4
    if (!isShort) {
      return { confidence: best.score }
    }

    // Short store names (e.g. PUB) OCR very poorly; allow a lower threshold only when unambiguous.
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

  // Ambiguity guard: if two stores are similarly close, don't auto-pick.
  if (second && second.score >= 0.75) {
    const gap = best.score - second.score
    if (gap < 0.05) {
      return { confidence: best.score }
    }
  }

  return { storeId: best.store.id, storeName: best.store.name, confidence: best.score }
}

function looksLikeHeaderOrNoise(text: string): boolean {
  const t = normalizeForMatch(text)
  if (!t) return true
  if (t.includes('dream jobs') || t === 'job' || t.includes('dream')) return true
  // Lots of pure numbers/symbols
  if (/^[0-9\s]+$/.test(t)) return true
  return false
}

function isLikelyName(text: string): boolean {
  const cleaned = sanitizeResidentName(text)
  if (!cleaned) return false
  if (isUnemployedText(cleaned) || isUnemployedText(text)) return false
  if (cleaned.length < 3) return false
  if (/\d/.test(cleaned)) return false
  // OCR sometimes removes the space between first/last name; allow longer single-token names.
  if (!cleaned.includes(' ') && cleaned.length < 6) return false
  return true
}

function isLikelyStoreName(text: string): boolean {
  const t = normalizeForMatch(text)
  if (!t) return false
  if (t.length < 3) return false
  if (isUnemployedText(t) || isUnemployedText(text)) return false
  if (/^[0-9\s]+$/.test(t)) return false
  return true
}

function dedupe(candidates: ScreenshotResidentCandidate[]): ScreenshotResidentCandidate[] {
  function currentKeyFor(c: ScreenshotResidentCandidate): string {
    if (c.currentJobStoreId) return c.currentJobStoreId
    if (c.currentJobRaw) return normalizeForMatch(c.currentJobRaw)
    return ''
  }

  function dreamKeyFor(c: ScreenshotResidentCandidate): string {
    return c.dreamJobStoreId ? c.dreamJobStoreId : normalizeForMatch(c.dreamJobRaw)
  }

  function baseKeyFor(c: ScreenshotResidentCandidate): string {
    return `${normalizeForMatch(c.name)}|${dreamKeyFor(c)}`
  }

  function isBetterCandidate(
    a: ScreenshotResidentCandidate,
    b: ScreenshotResidentCandidate
  ): boolean {
    // Prefer store-id matches over raw text, fewer issues, then higher confidence.
    const aHasId = Boolean(a.dreamJobStoreId)
    const bHasId = Boolean(b.dreamJobStoreId)
    if (aHasId !== bHasId) return aHasId

    const aIssues = a.issues?.length ?? 0
    const bIssues = b.issues?.length ?? 0
    if (aIssues !== bIssues) return aIssues < bIssues

    const aConf = typeof a.matchConfidence === 'number' ? a.matchConfidence : 0
    const bConf = typeof b.matchConfidence === 'number' ? b.matchConfidence : 0
    if (aConf !== bConf) return aConf > bConf

    // Prefer the candidate that detected current job info.
    const aHasCurrent = Boolean(a.currentJobStoreId || a.currentJobRaw)
    const bHasCurrent = Boolean(b.currentJobStoreId || b.currentJobRaw)
    if (aHasCurrent !== bHasCurrent) return aHasCurrent

    return false
  }

  function mergeCandidates(
    keep: ScreenshotResidentCandidate,
    incoming: ScreenshotResidentCandidate
  ): ScreenshotResidentCandidate {
    // Choose the better base record, but preserve any missing current-job info.
    const base = isBetterCandidate(incoming, keep) ? { ...incoming } : { ...keep }
    const other = base === incoming ? keep : incoming

    // Merge selection.
    base.selected = Boolean(base.selected || other.selected)

    // Merge current-job fields if missing.
    if (!base.currentJobStoreId && other.currentJobStoreId)
      base.currentJobStoreId = other.currentJobStoreId
    if (!base.currentJobRaw && other.currentJobRaw) base.currentJobRaw = other.currentJobRaw
    if (base.currentMatchConfidence === undefined && other.currentMatchConfidence !== undefined) {
      base.currentMatchConfidence = other.currentMatchConfidence
    }
    if (!base.matchedCurrentStoreName && other.matchedCurrentStoreName) {
      base.matchedCurrentStoreName = other.matchedCurrentStoreName
    }

    // Keep the more helpful issue list (prefer non-empty).
    if ((base.issues?.length ?? 0) === 0 && (other.issues?.length ?? 0) > 0) {
      base.issues = other.issues
    }

    return base
  }

  // Group by (name + dream), then within each group keep separate entries only when
  // both have non-empty current-job keys that disagree.
  const grouped = new Map<string, ScreenshotResidentCandidate[]>()

  for (const c of candidates) {
    const baseKey = baseKeyFor(c)
    const list = grouped.get(baseKey) ?? []
    const cCurrentKey = currentKeyFor(c)

    let merged = false
    for (let i = 0; i < list.length; i++) {
      const existing = list[i]
      const eCurrentKey = currentKeyFor(existing)

      // Treat missing current-job as a wildcard match.
      const compatible = eCurrentKey === cCurrentKey || eCurrentKey === '' || cCurrentKey === ''
      if (compatible) {
        list[i] = mergeCandidates(existing, c)
        merged = true
        break
      }
    }

    if (!merged) {
      list.push(c)
    }

    grouped.set(baseKey, list)
  }

  return Array.from(grouped.values()).flat()
}

function columnForLine(line: TesseractLine, inferredWidth: number): 'left' | 'middle' | 'right' {
  const x = line.bbox.x0
  const w = Math.max(1, inferredWidth)

  // Heuristic split into 3 columns (name | current job | dream job)
  if (x < w * 0.42) return 'left'
  if (x < w * 0.72) return 'middle'
  return 'right'
}

function splitRowIntoColumns(params: {
  rowLines: TesseractLine[]
  inferredWidth: number
}): Array<{ lines: TesseractLine[] }> {
  const { rowLines, inferredWidth } = params
  const lines = rowLines.filter(l => l.text.trim() !== '')
  if (lines.length === 0) return []

  const sortedByX = [...lines].sort((a, b) => a.bbox.x0 - b.bbox.x0)
  const xs = sortedByX.map(l => l.bbox.x0)

  const gaps: Array<{ idx: number; gap: number }> = []
  for (let i = 1; i < xs.length; i++) {
    gaps.push({ idx: i, gap: xs[i] - xs[i - 1] })
  }

  const gapThreshold = Math.max(70, inferredWidth * 0.12)
  const bigGaps = gaps.filter(g => g.gap >= gapThreshold).sort((a, b) => b.gap - a.gap)

  // Two big gaps => 3 columns; one big gap => 2 columns; else fallback to heuristic columnForLine.
  if (bigGaps.length >= 2) {
    const split1Idx = Math.min(bigGaps[0].idx, bigGaps[1].idx)
    const split2Idx = Math.max(bigGaps[0].idx, bigGaps[1].idx)
    const split1 = (xs[split1Idx - 1] + xs[split1Idx]) / 2
    const split2 = (xs[split2Idx - 1] + xs[split2Idx]) / 2

    const c1: TesseractLine[] = []
    const c2: TesseractLine[] = []
    const c3: TesseractLine[] = []
    for (const l of lines) {
      if (l.bbox.x0 < split1) c1.push(l)
      else if (l.bbox.x0 < split2) c2.push(l)
      else c3.push(l)
    }
    return [{ lines: c1 }, { lines: c2 }, { lines: c3 }]
  }

  if (bigGaps.length === 1) {
    const splitIdx = bigGaps[0].idx
    const split = (xs[splitIdx - 1] + xs[splitIdx]) / 2
    const left: TesseractLine[] = []
    const right: TesseractLine[] = []
    for (const l of lines) {
      if (l.bbox.x0 < split) left.push(l)
      else right.push(l)
    }
    return [{ lines: left }, { lines: right }]
  }

  const left: TesseractLine[] = []
  const middle: TesseractLine[] = []
  const right: TesseractLine[] = []
  for (const l of lines) {
    const col = columnForLine(l, inferredWidth)
    if (col === 'left') left.push(l)
    if (col === 'middle') middle.push(l)
    if (col === 'right') right.push(l)
  }
  return [{ lines: left }, { lines: middle }, { lines: right }]
}

function groupLinesIntoRows(lines: TesseractLine[]): Array<{ y0: number; lines: TesseractLine[] }> {
  const sorted = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0)
  const rows: Array<{ y0: number; lines: TesseractLine[] }> = []

  const heights = sorted
    .map(l => Math.max(0, l.bbox.y1 - l.bbox.y0))
    .filter(h => h > 0)
    .sort((a, b) => a - b)
  const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 0
  const clusterThreshold = Math.max(26, Math.round(medianHeight * 1.6))

  for (const line of sorted) {
    const last = rows[rows.length - 1]
    if (!last) {
      rows.push({ y0: line.bbox.y0, lines: [line] })
      continue
    }

    // Tight y clustering to keep a single resident row together.
    // (If OCR splits rows, we still fall back to the legacy vertical parser.)
    if (Math.abs(line.bbox.y0 - last.y0) <= clusterThreshold) {
      last.lines.push(line)
    } else {
      rows.push({ y0: line.bbox.y0, lines: [line] })
    }
  }

  return rows
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractResidentNameFromOcrLine(raw: string, storesList?: Store[]): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  // If OCR merges the row, we can usually cut the name at UNEMPLOYED or the first store name.
  let cutIndex = -1
  const unemployedMatch = /\bunemployed\b/i.exec(trimmed)
  if (unemployedMatch?.index !== undefined && unemployedMatch.index > 0) {
    cutIndex = unemployedMatch.index
  }

  if (cutIndex === -1 && storesList) {
    for (const store of storesList) {
      const words = store.name.trim().split(/\s+/).filter(Boolean)
      if (words.length === 0) continue
      const pattern = `\\b${words.map(escapeRegExp).join('\\s+')}\\b`
      const re = new RegExp(pattern, 'i')
      const m = re.exec(trimmed)
      if (m?.index !== undefined && m.index > 0) {
        if (cutIndex === -1 || m.index < cutIndex) cutIndex = m.index
      }
    }
  }

  // Per your rule: in this UI, once numbers start appearing after the name, the name is done.
  const firstDigit = trimmed.search(/\d/)
  if (firstDigit > 0) {
    cutIndex = cutIndex === -1 ? firstDigit : Math.min(cutIndex, firstDigit)
  }
  const letterDigits = /\b[a-zA-Z]\d{2,}\b/.exec(trimmed)
  if (letterDigits?.index !== undefined && letterDigits.index > 0) {
    cutIndex = cutIndex === -1 ? letterDigits.index : Math.min(cutIndex, letterDigits.index)
  }

  const candidate = (cutIndex > 0 ? trimmed.slice(0, cutIndex) : trimmed).trim()
  const name = sanitizeResidentName(candidate)
  return isUnemployedText(name) ? '' : name
}

function pickBestName(
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
      // Avoid mistaking store names (e.g. "SODA BREWERY") for resident names.
      const storeMatch = matchStore(c.name, stores)
      return !(storeMatch.storeId && storeMatch.confidence >= 0.85)
    })
    .sort((a, b) => b.name.length - a.name.length)
  return candidates[0]
}

function pickBestStoreMatch(
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

function findEmbeddedStoresInText(
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

function extractCandidatesFromPlainText(params: {
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

    // If OCR merges the whole row, try to grab embedded stores.
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

function extractCandidatesThreeColumn(params: {
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

    // Find the column most likely to contain the resident name.
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

    // Current job is usually under the name (same column). Dream job is usually in the other (right) column.
    const nameColTexts = colTexts[nameColIndex] ?? []
    const nonNameInNameCol = nameColTexts.filter(
      t => normalizeForMatch(t) !== normalizeForMatch(namePick.raw)
    )

    const otherIndexes = cols.map((_, i) => i).filter(i => i !== nameColIndex)
    const dreamColIndex = otherIndexes.length ? otherIndexes[otherIndexes.length - 1] : -1
    const dreamColTexts = dreamColIndex >= 0 ? (colTexts[dreamColIndex] ?? []) : []

    const nonNameTrimmed = nonNameInNameCol.map(t => t.trim()).filter(Boolean)
    const hasUnemployed = nonNameTrimmed.some(t => isUnemployedText(t))
    // Preserve UNEMPLOYED as a raw current job even though it won't match a store.
    const currentJobRaw = hasUnemployed
      ? 'UNEMPLOYED'
      : nonNameTrimmed.sort((a, b) => b.length - a.length)[0]

    const currentFromNameCol = pickBestStoreMatch(nonNameInNameCol, stores)
    const dreamFromDreamCol = pickBestStoreMatch(dreamColTexts, stores)

    // If we ended up with 3 columns, keep a small fallback path.
    const middleTexts = colTexts.length === 3 ? (colTexts[1] ?? []) : []
    const rightTexts = colTexts.length === 3 ? (colTexts[2] ?? []) : []
    const currentFromMiddle = middleTexts.length
      ? pickBestStoreMatch(middleTexts, stores)
      : { confidence: 0 }
    const dreamFromRight = rightTexts.length
      ? pickBestStoreMatch(rightTexts, stores)
      : { confidence: 0 }

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

    // If OCR merged the row (or column splits are noisy), use embedded store hits.
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

    if (
      embedded.length >= 2 &&
      !hasUnemployed &&
      (!currentMatch.storeId || currentMatch.confidence < 0.75)
    ) {
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

    if (
      (currentJobRaw ?? currentMatch.raw) &&
      !currentMatch.storeId &&
      !isUnemployedText(currentJobRaw ?? currentMatch.raw ?? '')
    ) {
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
      selected:
        Boolean(namePick.name) &&
        Boolean(fallbackDream.storeId) &&
        fallbackDream.confidence >= AUTO_SELECT_MIN_CONFIDENCE,
      issues,
      sourceFileName,
    })
  }

  return out
}

async function preprocessImageForOcr(
  file: File,
  opts?: {
    contrast?: number
    gamma?: number
    scaleBoostSmall?: number
    scaleBoostLarge?: number
  }
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scaleBoostSmall = opts?.scaleBoostSmall ?? 2
  const scaleBoostLarge = opts?.scaleBoostLarge ?? 1.5
  const scale = bitmap.width < 900 ? scaleBoostSmall : scaleBoostLarge

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close?.()
    throw new Error('Canvas 2D context not available')
  }

  // Pixel-font screenshots often do better with nearest-neighbor scaling.
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data

  // Grayscale + gentle gamma + contrast boost.
  // Gamma < 1 brightens mid-tones, which helps the gray dream-job text.
  const contrast = opts?.contrast ?? 1.6
  const gamma = opts?.gamma ?? 0.85
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const gammaAdjusted = 255 * Math.pow(Math.max(0, Math.min(1, lum / 255)), gamma)
    const boosted = (gammaAdjusted - 128) * contrast + 128
    const v = Math.max(0, Math.min(255, Math.round(boosted)))
    d[i] = v
    d[i + 1] = v
    d[i + 2] = v
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function extractCandidatesVerticalPair(params: {
  lines: TesseractLine[]
  inferredWidth: number
  stores: Store[]
  sourceFileName: string
}): ScreenshotResidentCandidate[] {
  const { lines, inferredWidth, stores, sourceFileName } = params

  // Existing behavior: scan left side, pairing a name line with the next store-like line beneath it.
  const leftThreshold = inferredWidth * 0.6

  const leftLines = lines
    .filter((l: TesseractLine) => !looksLikeHeaderOrNoise(l.text))
    .filter((l: TesseractLine) => l.bbox.x0 < leftThreshold)
    .sort((a: TesseractLine, b: TesseractLine) => a.bbox.y0 - b.bbox.y0)

  const out: ScreenshotResidentCandidate[] = []
  let pendingName: { text: string; y0: number } | undefined

  for (const line of leftLines) {
    const raw = line.text.trim()
    if (!raw) continue

    if (!pendingName) {
      const extracted = extractResidentNameFromOcrLine(raw, stores)
      if (extracted && isLikelyName(extracted)) {
        // In some layouts, store names appear on the left too; don't treat them as names.
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
      pendingName =
        extracted && isLikelyName(extracted) ? { text: extracted, y0: line.bbox.y0 } : undefined
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
      selected:
        Boolean(name) && Boolean(match.storeId) && match.confidence >= AUTO_SELECT_MIN_CONFIDENCE,
      issues,
      sourceFileName,
    })

    pendingName = undefined
  }

  return out
}

export async function extractResidentsFromScreenshots(params: {
  files: File[]
  stores: Store[]
  ocrEngine?: 'local' | 'google'
  onProgress?: (info: {
    phase: 'loading' | 'recognizing' | 'cloud'
    fileName?: string
    progress?: number
    fileIndex?: number
    fileCount?: number
  }) => void
}): Promise<ScreenshotResidentCandidate[]> {
  const { files, stores, onProgress } = params
  const ocrEngine = params.ocrEngine ?? 'local'

  if (files.length === 0) return []

  onProgress?.({ phase: 'loading', progress: 0 })

  let currentFileIndex = 0
  let currentFileName: string | undefined
  const fileCount = files.length

  async function fileToBase64(file: File): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    })

    const idx = dataUrl.indexOf('base64,')
    if (idx < 0) throw new Error('Unexpected file encoding')
    return dataUrl.slice(idx + 'base64,'.length)
  }

  async function recognizeWithGoogleVision(
    file: File
  ): Promise<{ lines: TesseractLine[]; text: string }> {
    const endpoint = '/.netlify/functions/google-vision-ocr'
    const imageBase64 = await fileToBase64(file)

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType: file.type || undefined,
        fileName: file.name,
      }),
    })

    if (!resp.ok) {
      if (resp.status === 404) {
        throw new Error(
          'Google Vision OCR endpoint not found. If you are running locally, start Netlify Dev (yarn dev:netlify) and open http://localhost:8888 (not the Vite-only server on 5173).'
        )
      }

      const contentType = resp.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const body = (await resp.json().catch(() => null)) as {
          error?: string
          details?: string
          status?: number
        } | null
        const detail = body?.details ? `: ${body.details}` : ''
        throw new Error(
          body?.error ? `${body.error}${detail}` : `Cloud OCR failed (${resp.status})`
        )
      }

      const msg = await resp.text().catch(() => '')
      throw new Error(`Cloud OCR failed (${resp.status})${msg ? `: ${msg}` : ''}`)
    }

    const data = (await resp.json()) as {
      text?: string
      lines?: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>
    }

    const lines: TesseractLine[] = (data.lines ?? [])
      .filter(l => typeof l?.text === 'string')
      .map(l => ({ text: l.text, bbox: l.bbox }))
    const text = typeof data.text === 'string' ? data.text : ''
    return { lines, text }
  }

  function parseResultForFile(params: {
    fileName: string
    page: { lines?: TesseractLine[]; text?: string }
  }): ScreenshotResidentCandidate[] {
    const { fileName, page } = params
    const lines: TesseractLine[] = page.lines ?? []
    const inferredWidth = Math.max(1, ...lines.map((l: TesseractLine) => l.bbox.x1))

    const threeCol = extractCandidatesThreeColumn({
      lines,
      inferredWidth,
      stores,
      sourceFileName: fileName,
    })

    const legacy = extractCandidatesVerticalPair({
      lines,
      inferredWidth,
      stores,
      sourceFileName: fileName,
    })

    if (threeCol.length === 0 && legacy.length === 0) {
      const fallbackText = typeof page.text === 'string' ? page.text : ''
      const textCandidates = fallbackText
        ? extractCandidatesFromPlainText({
            text: fallbackText,
            stores,
            sourceFileName: fileName,
          })
        : []
      return textCandidates
    }

    return [...threeCol, ...legacy]
  }

  // Explicit cloud mode: do not run local OCR.
  if (ocrEngine === 'google') {
    const allCandidates: ScreenshotResidentCandidate[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentFileIndex = i
      currentFileName = file.name

      onProgress?.({
        phase: 'cloud',
        fileName: file.name,
        progress: 0,
        fileIndex: i,
        fileCount,
      })

      const cloud = await recognizeWithGoogleVision(file)

      onProgress?.({
        phase: 'cloud',
        fileName: file.name,
        progress: 1,
        fileIndex: i,
        fileCount,
      })
      const page = { lines: cloud.lines, text: cloud.text }
      const candidates = parseResultForFile({ fileName: file.name, page })
      allCandidates.push(...dedupe(candidates))
    }

    return dedupe(allCandidates)
  }

  const worker = await createWorker('eng', undefined, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          phase: 'recognizing',
          fileName: currentFileName,
          progress: m.progress,
          fileIndex: currentFileIndex,
          fileCount,
        })
      }
    },
  })

  try {
    // Better for list/table layouts like the Tiny Tower residents screen.
    await worker.setParameters({ tessedit_pageseg_mode: 6 as unknown as PSM })

    const allCandidates: ScreenshotResidentCandidate[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentFileIndex = i
      currentFileName = file.name
      onProgress?.({
        phase: 'recognizing',
        fileName: file.name,
        progress: 0,
        fileIndex: i,
        fileCount,
      })

      // Attempt 1: gamma/contrast preprocessed, PSM 6
      const imageForOcr = await preprocessImageForOcr(file, { contrast: 1.55, gamma: 0.85 }).catch(
        () => file
      )
      const result = await worker.recognize(imageForOcr)
      const page = result.data as unknown as { lines?: TesseractLine[]; text?: string }
      let candidates = parseResultForFile({ fileName: file.name, page })

      // If we got too few, try a second pass with a different preprocess and/or PSM.
      // This avoids regressions where a specific preprocess hurts OCR on some devices.
      if (candidates.length < 10) {
        const altImage = await preprocessImageForOcr(file, {
          contrast: 1.2,
          gamma: 0.7,
          scaleBoostSmall: 2.2,
          scaleBoostLarge: 1.7,
        }).catch(() => file)

        const alt = await worker.recognize(altImage)
        const altPage = alt.data as unknown as { lines?: TesseractLine[]; text?: string }
        candidates = [...candidates, ...parseResultForFile({ fileName: file.name, page: altPage })]

        // Final fallback: sparse text mode can sometimes recover missed gray/right-column text.
        await worker.setParameters({ tessedit_pageseg_mode: 11 as unknown as PSM })
        const sparse = await worker.recognize(file)
        const sparsePage = sparse.data as unknown as { lines?: TesseractLine[]; text?: string }
        candidates = [
          ...candidates,
          ...parseResultForFile({ fileName: file.name, page: sparsePage }),
        ]

        // Restore default for the next file.
        await worker.setParameters({ tessedit_pageseg_mode: 6 as unknown as PSM })
      }

      allCandidates.push(...dedupe(candidates))
    }

    return dedupe(allCandidates)
  } finally {
    await worker.terminate()
  }
}
