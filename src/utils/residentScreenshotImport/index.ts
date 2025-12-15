import { dedupe } from './dedupe'
import { extractCandidatesFromPlainText } from './extractors/plainText'
import { extractCandidatesThreeColumn } from './extractors/threeColumn'
import { extractCandidatesVerticalPair } from './extractors/verticalPair'
import { recognizeWithGoogleVision } from './ocr/googleVision'
import type {
  ExtractResidentsFromScreenshotsParams,
  ScreenshotResidentCandidate,
  TesseractLine,
} from './types'

export type { ScreenshotResidentCandidate } from './types'

export async function extractResidentsFromScreenshots(
  params: ExtractResidentsFromScreenshotsParams
): Promise<ScreenshotResidentCandidate[]> {
  const { files, stores, onProgress } = params
  const fileCount = files.length

  if (fileCount === 0) return []

  onProgress?.({ phase: 'loading', progress: 0 })

  function parseResultForFile(p: {
    fileName: string
    page: { lines?: TesseractLine[]; text?: string }
  }): ScreenshotResidentCandidate[] {
    const { fileName, page } = p
    const lines: TesseractLine[] = page.lines ?? []
    const inferredWidth = Math.max(1, ...lines.map(l => l.bbox.x1))

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
      return fallbackText
        ? extractCandidatesFromPlainText({ text: fallbackText, stores, sourceFileName: fileName })
        : []
    }

    return [...threeCol, ...legacy]
  }

  const allCandidates: ScreenshotResidentCandidate[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    onProgress?.({ phase: 'cloud', fileName: file.name, progress: 0, fileIndex: i, fileCount })
    const cloud = await recognizeWithGoogleVision(file)
    onProgress?.({ phase: 'cloud', fileName: file.name, progress: 1, fileIndex: i, fileCount })

    const candidates = parseResultForFile({
      fileName: file.name,
      page: { lines: cloud.lines, text: cloud.text },
    })
    allCandidates.push(...dedupe(candidates))
  }

  return dedupe(allCandidates)
}
