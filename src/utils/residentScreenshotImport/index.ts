import type { PSM } from 'tesseract.js'
import { createWorker } from 'tesseract.js'

import { dedupe } from './dedupe'
import { extractCandidatesFromPlainText } from './extractors/plainText'
import { extractCandidatesThreeColumn } from './extractors/threeColumn'
import { extractCandidatesVerticalPair } from './extractors/verticalPair'
import { recognizeWithGoogleVision } from './ocr/googleVision'
import { preprocessImageForOcr } from './ocr/preprocess'
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
  const ocrEngine = params.ocrEngine ?? 'local'

  if (files.length === 0) return []

  onProgress?.({ phase: 'loading', progress: 0 })

  let currentFileIndex = 0
  let currentFileName: string | undefined
  const fileCount = files.length

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

  if (ocrEngine === 'google') {
    const allCandidates: ScreenshotResidentCandidate[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentFileIndex = i
      currentFileName = file.name

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

      const imageForOcr = await preprocessImageForOcr(file, { contrast: 1.55, gamma: 0.85 }).catch(
        () => file
      )
      const result = await worker.recognize(imageForOcr)
      const page = result.data as unknown as { lines?: TesseractLine[]; text?: string }
      let candidates = parseResultForFile({ fileName: file.name, page })

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

        await worker.setParameters({ tessedit_pageseg_mode: 11 as unknown as PSM })
        const sparse = await worker.recognize(file)
        const sparsePage = sparse.data as unknown as { lines?: TesseractLine[]; text?: string }
        candidates = [
          ...candidates,
          ...parseResultForFile({ fileName: file.name, page: sparsePage }),
        ]

        await worker.setParameters({ tessedit_pageseg_mode: 6 as unknown as PSM })
      }

      allCandidates.push(...dedupe(candidates))
    }

    return dedupe(allCandidates)
  } finally {
    await worker.terminate()
  }
}
