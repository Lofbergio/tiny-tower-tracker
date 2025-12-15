import { dedupe } from './dedupe'
import { extractCandidatesFromPlainText } from './extractors/plainText'
import { extractCandidatesThreeColumn } from './extractors/threeColumn'
import { extractCandidatesVerticalPair } from './extractors/verticalPair'
import { recognizeWithGoogleVision } from './googleVision'
import type {
  ExtractResidentsFromScreenshotsParams,
  OcrLine,
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

  function parsePage(page: OcrPage): ScreenshotResidentCandidate[] {
    const lines: OcrLine[] = page.lines ?? []
    const inferredWidth = Math.max(1, ...lines.map(l => l.bbox.x1))

    const threeCol = extractCandidatesThreeColumn({
      lines,
      inferredWidth,
      stores,
      sourceFileName: page.fileName,
    })

    const legacy = extractCandidatesVerticalPair({
      lines,
      inferredWidth,
      stores,
      sourceFileName: page.fileName,
    })

    if (threeCol.length === 0 && legacy.length === 0) {
      const fallbackText = typeof page.text === 'string' ? page.text : ''
      return fallbackText
        ? extractCandidatesFromPlainText({
            text: fallbackText,
            stores,
            sourceFileName: page.fileName,
          })
        : []
    }

    return dedupe([...threeCol, ...legacy])
  }

  const allCandidates: ScreenshotResidentCandidate[] = []
  for (const page of pages) {
    allCandidates.push(...parsePage(page))
  }

  return dedupe(allCandidates)
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
