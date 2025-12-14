import type { Store } from '@/types'
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

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function sanitizeResidentName(input: string): string {
  // Keep only chars allowed by validation (letters/digits/spaces/'-)
  const cleaned = input
    .replace(/[’]/g, "'")
    .replace(/[^a-zA-Z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

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

  // Fast exact matches
  const exact = stores.find(s => s.name.toLowerCase() === raw.toLowerCase())
  if (exact) return { storeId: exact.id, storeName: exact.name, confidence: 1 }

  const normalizedRaw = normalizeForMatch(raw)
  const normalizedExact = stores.find(s => normalizeForMatch(s.name) === normalizedRaw)
  if (normalizedExact) {
    return { storeId: normalizedExact.id, storeName: normalizedExact.name, confidence: 0.98 }
  }

  // Fuzzy match
  let best: { store: Store; score: number } | undefined
  for (const store of stores) {
    const score = similarity(raw, store.name)
    if (!best || score > best.score) {
      best = { store, score }
    }
  }

  if (!best) return { confidence: 0 }

  // Heuristic threshold: below this we require manual fix
  if (best.score < 0.75) {
    return { confidence: best.score }
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
  if (cleaned.length < 3) return false
  if (/\d/.test(cleaned)) return false
  // Names almost always have a space in Tiny Tower
  if (!cleaned.includes(' ')) return false
  return true
}

function isLikelyStoreName(text: string): boolean {
  const t = normalizeForMatch(text)
  if (!t) return false
  if (t.length < 3) return false
  if (/^[0-9\s]+$/.test(t)) return false
  return true
}

function dedupe(candidates: ScreenshotResidentCandidate[]): ScreenshotResidentCandidate[] {
  const seen = new Set<string>()
  const out: ScreenshotResidentCandidate[] = []
  for (const c of candidates) {
    const currentKey = c.currentJobStoreId
      ? c.currentJobStoreId
      : c.currentJobRaw
        ? normalizeForMatch(c.currentJobRaw)
        : ''
    const dreamKey = c.dreamJobStoreId ? c.dreamJobStoreId : normalizeForMatch(c.dreamJobRaw)
    const key = `${normalizeForMatch(c.name)}|${dreamKey}|${currentKey}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function columnForLine(line: TesseractLine, inferredWidth: number): 'left' | 'middle' | 'right' {
  const x = line.bbox.x0
  const w = Math.max(1, inferredWidth)

  // Heuristic split into 3 columns (name | current job | dream job)
  if (x < w * 0.42) return 'left'
  if (x < w * 0.72) return 'middle'
  return 'right'
}

function groupLinesIntoRows(lines: TesseractLine[]): Array<{ y0: number; lines: TesseractLine[] }> {
  const sorted = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0)
  const rows: Array<{ y0: number; lines: TesseractLine[] }> = []

  for (const line of sorted) {
    const last = rows[rows.length - 1]
    if (!last) {
      rows.push({ y0: line.bbox.y0, lines: [line] })
      continue
    }

    // Tight y clustering to keep a single resident row together.
    // (If OCR splits rows, we still fall back to the legacy vertical parser.)
    if (Math.abs(line.bbox.y0 - last.y0) <= 26) {
      last.lines.push(line)
    } else {
      rows.push({ y0: line.bbox.y0, lines: [line] })
    }
  }

  return rows
}

function pickBestName(texts: string[]): { raw: string; name: string } | undefined {
  const candidates = texts
    .map(raw => ({ raw: raw.trim(), name: sanitizeResidentName(raw) }))
    .filter(c => isLikelyName(c.name))
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
    const leftTexts: string[] = []
    const middleTexts: string[] = []
    const rightTexts: string[] = []

    for (const line of row.lines) {
      const col = columnForLine(line, inferredWidth)
      if (col === 'left') leftTexts.push(line.text)
      if (col === 'middle') middleTexts.push(line.text)
      if (col === 'right') rightTexts.push(line.text)
    }

    const namePick = pickBestName(leftTexts)
    if (!namePick) continue

    const currentMatch = pickBestStoreMatch(middleTexts, stores)
    const dreamMatch = pickBestStoreMatch(rightTexts, stores)

    // Some screenshots may only have 2 columns; allow dream job to be the best match outside the left column.
    const fallbackDream =
      dreamMatch.confidence > 0 ? dreamMatch : pickBestStoreMatch(middleTexts, stores)

    const issues: string[] = []

    if (!fallbackDream.raw) {
      issues.push('Dream job could not be parsed')
    } else if (!fallbackDream.storeId) {
      issues.push('Could not confidently match dream job to a known store')
    }

    if (currentMatch.raw && !currentMatch.storeId) {
      issues.push('Could not confidently match current job to a known store')
    }

    out.push({
      nameRaw: namePick.raw,
      currentJobRaw: currentMatch.raw,
      dreamJobRaw: fallbackDream.raw ?? '',
      name: namePick.name,
      currentJobStoreId: currentMatch.storeId,
      dreamJobStoreId: fallbackDream.storeId,
      matchedCurrentStoreName: currentMatch.storeName,
      matchedStoreName: fallbackDream.storeName,
      currentMatchConfidence: currentMatch.confidence,
      matchConfidence: fallbackDream.confidence,
      selected: Boolean(namePick.name) && Boolean(fallbackDream.storeId),
      issues,
      sourceFileName,
    })
  }

  return out
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
      if (isLikelyName(raw)) {
        pendingName = { text: raw, y0: line.bbox.y0 }
      }
      continue
    }

    const verticalGap = line.bbox.y0 - pendingName.y0
    if (verticalGap < 0) {
      pendingName = undefined
      continue
    }

    if (verticalGap > 80) {
      pendingName = isLikelyName(raw) ? { text: raw, y0: line.bbox.y0 } : undefined
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
      selected: Boolean(name) && Boolean(match.storeId),
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
  onProgress?: (info: {
    phase: 'loading' | 'recognizing'
    fileName?: string
    progress?: number
  }) => void
}): Promise<ScreenshotResidentCandidate[]> {
  const { files, stores, onProgress } = params

  if (files.length === 0) return []

  onProgress?.({ phase: 'loading', progress: 0 })

  const worker = await createWorker('eng', undefined, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.({ phase: 'recognizing', progress: m.progress })
      }
    },
  })

  try {
    const allCandidates: ScreenshotResidentCandidate[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress?.({ phase: 'recognizing', fileName: file.name, progress: 0 })

      const result = await worker.recognize(file)
      const page = result.data as unknown as { lines?: TesseractLine[] }
      const lines: TesseractLine[] = page.lines ?? []

      // Infer width from OCR bboxes
      const inferredWidth = Math.max(1, ...lines.map((l: TesseractLine) => l.bbox.x1))

      // Prefer 3-column parsing (name | current job | dream job). If it doesn't find anything,
      // fall back to the legacy vertical pairing logic.
      const threeCol = extractCandidatesThreeColumn({
        lines,
        inferredWidth,
        stores,
        sourceFileName: file.name,
      })

      const legacy = extractCandidatesVerticalPair({
        lines,
        inferredWidth,
        stores,
        sourceFileName: file.name,
      })

      allCandidates.push(...threeCol, ...legacy)
    }

    return dedupe(allCandidates)
  } finally {
    await worker.terminate()
  }
}
