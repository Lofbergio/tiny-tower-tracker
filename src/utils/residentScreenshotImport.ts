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

function pickBestName(
  texts: string[],
  stores?: Store[]
): { raw: string; name: string } | undefined {
  const candidates = texts
    .map(raw => ({ raw: raw.trim(), name: sanitizeResidentName(raw) }))
    .filter(c => isLikelyName(c.name))
    .filter(c => {
      if (!stores) return true
      // Avoid mistaking store names (e.g. "SODA BREWERY") for resident names.
      const storeMatch = matchStore(c.name, stores)
      return !(storeMatch.storeId && storeMatch.confidence >= 0.92)
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
    if (isLikelyName(raw)) {
      const embedded = findEmbeddedStoresInText(raw, stores)
      if (embedded.length > 0) {
        const name = sanitizeResidentName(raw)
        const dreamStore = embedded[0]
        const currentStore = embedded.length > 1 ? embedded[1] : undefined
        out.push({
          nameRaw: raw,
          dreamJobRaw: dreamStore.store.name,
          currentJobRaw: currentStore?.store.name,
          name,
          dreamJobStoreId: dreamStore.store.id,
          currentJobStoreId: currentStore?.store.id,
          matchedStoreName: dreamStore.store.name,
          matchedCurrentStoreName: currentStore?.store.name,
          matchConfidence: 0.9,
          currentMatchConfidence: currentStore ? 0.9 : undefined,
          selected:
            Boolean(name) && Boolean(dreamStore.store.id) && 0.9 >= AUTO_SELECT_MIN_CONFIDENCE,
          issues: [],
          sourceFileName,
        })
        pendingName = undefined
        continue
      }

      pendingName = raw
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
    const leftTexts: string[] = []
    const middleTexts: string[] = []
    const rightTexts: string[] = []

    for (const line of row.lines) {
      const col = columnForLine(line, inferredWidth)
      if (col === 'left') leftTexts.push(line.text)
      if (col === 'middle') middleTexts.push(line.text)
      if (col === 'right') rightTexts.push(line.text)
    }

    const namePick = pickBestName(leftTexts, stores)
    if (!namePick) continue

    // Dream Jobs screenshot layout often has: left = name + dream job, right = current job.
    const leftNonNameTexts = leftTexts.filter(
      t => normalizeForMatch(t) !== normalizeForMatch(namePick.raw)
    )

    const dreamFromLeft = pickBestStoreMatch(leftNonNameTexts, stores)
    const currentFromRight = pickBestStoreMatch(rightTexts, stores)
    const currentFromMiddle = pickBestStoreMatch(middleTexts, stores)
    const dreamFromRight = pickBestStoreMatch(rightTexts, stores)

    const currentMatch = currentFromRight.confidence >= 0.75 ? currentFromRight : currentFromMiddle

    // Prefer dream job from the left column if present; otherwise fall back to the classic 3-col assumptions.
    let fallbackDream =
      dreamFromLeft.confidence > 0
        ? dreamFromLeft
        : dreamFromRight.confidence > 0
          ? dreamFromRight
          : pickBestStoreMatch(middleTexts, stores)

    // If OCR merged the row into the left column, attempt to detect store names embedded in the row text.
    if (fallbackDream.confidence === 0) {
      const rowText = row.lines.map(l => l.text).join(' ')
      const embedded = findEmbeddedStoresInText(rowText, stores)
      if (embedded.length > 0) {
        fallbackDream = {
          raw: embedded[0].store.name,
          storeId: embedded[0].store.id,
          storeName: embedded[0].store.name,
          confidence: 0.9,
        }
      }
    }

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

async function preprocessImageForOcr(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scale = bitmap.width < 900 ? 2 : 1.5

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

  // Grayscale + contrast boost (helps Tiny Tower UI text on dark backgrounds).
  const contrast = 1.6
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const boosted = (lum - 128) * contrast + 128
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
      if (isLikelyName(raw)) {
        // In some layouts, store names appear on the left too; don't treat them as names.
        const storeLike = matchStore(raw, stores)
        if (storeLike.storeId && storeLike.confidence >= 0.92) {
          continue
        }
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
  onProgress?: (info: {
    phase: 'loading' | 'recognizing'
    fileName?: string
    progress?: number
    fileIndex?: number
    fileCount?: number
  }) => void
}): Promise<ScreenshotResidentCandidate[]> {
  const { files, stores, onProgress } = params

  if (files.length === 0) return []

  onProgress?.({ phase: 'loading', progress: 0 })

  let currentFileIndex = 0
  let currentFileName: string | undefined
  const fileCount = files.length

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
    // Better for UI screenshots with scattered text regions.
    await worker.setParameters({ tessedit_pageseg_mode: 11 as unknown as PSM })

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

      const imageForOcr = await preprocessImageForOcr(file).catch(() => file)
      const result = await worker.recognize(imageForOcr)
      const page = result.data as unknown as { lines?: TesseractLine[]; text?: string }
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

      if (threeCol.length === 0 && legacy.length === 0) {
        const fallbackText = typeof page.text === 'string' ? page.text : ''
        const textCandidates = fallbackText
          ? extractCandidatesFromPlainText({
              text: fallbackText,
              stores,
              sourceFileName: file.name,
            })
          : []
        allCandidates.push(...textCandidates)
      } else {
        allCandidates.push(...threeCol, ...legacy)
      }
    }

    return dedupe(allCandidates)
  } finally {
    await worker.terminate()
  }
}
