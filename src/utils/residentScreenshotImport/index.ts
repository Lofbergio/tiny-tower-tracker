import { extractCandidates } from './extract'
import { recognizeWithGoogleVision } from './googleVision'
import type {
  ExtractResidentsFromScreenshotsParams,
  OcrPage,
  ScreenshotResidentCandidate,
} from './types'

export type { ScreenshotResidentCandidate } from './types'

export function extractResidentsFromOcrPages(params: {
  pages: OcrPage[]
  stores: ExtractResidentsFromScreenshotsParams['stores']
}): ScreenshotResidentCandidate[] {
  const { pages, stores } = params
  if (pages.length === 0) return []

  const allCandidates: ScreenshotResidentCandidate[] = []

  for (const page of pages) {
    const lines = page.lines ?? []
    if (lines.length === 0) continue

    const inferredWidth = Math.max(1, ...lines.map(l => l.bbox.x1))
    const candidates = extractCandidates({
      lines,
      inferredWidth,
      stores,
      sourceFileName: page.fileName,
    })
    allCandidates.push(...candidates)
  }

  // Deduplicate across pages (in case same resident appears in multiple screenshots)
  const byName = new Map<string, ScreenshotResidentCandidate>()
  for (const c of allCandidates) {
    const key = c.name.toLowerCase().replace(/\s+/g, '')
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, c)
    } else {
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
      existing.selected = existing.selected || c.selected
    }
  }

  return Array.from(byName.values())
}

export async function extractResidentsFromScreenshots(
  params: ExtractResidentsFromScreenshotsParams
): Promise<ScreenshotResidentCandidate[]> {
  const { files, stores, onProgress, onOcrPage } = params
  const fileCount = files.length

  if (fileCount === 0) return []

  const pages: OcrPage[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Start processing with indeterminate progress
    onProgress?.({
      phase: 'processing',
      fileName: file.name,
      progress: undefined,
      fileIndex: i,
      fileCount,
    })
    const cloud = await recognizeWithGoogleVision(file)
    // Mark as complete for this file
    onProgress?.({ phase: 'processing', fileName: file.name, progress: 1, fileIndex: i, fileCount })

    const page: OcrPage = { fileName: file.name, lines: cloud.lines, text: cloud.text }
    pages.push(page)
    onOcrPage?.(page)
  }

  return extractResidentsFromOcrPages({ pages, stores })
}
