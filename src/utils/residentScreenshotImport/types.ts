import type { Store } from '@/types'

export type TesseractBBox = { x0: number; y0: number; x1: number; y1: number }
export type TesseractLine = { text: string; bbox: TesseractBBox }

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

export type OcrEngine = 'local' | 'google'

export type ExtractProgressInfo = {
  phase: 'loading' | 'recognizing' | 'cloud'
  fileName?: string
  progress?: number
  fileIndex?: number
  fileCount?: number
}

export type ExtractResidentsFromScreenshotsParams = {
  files: File[]
  stores: Store[]
  ocrEngine?: OcrEngine
  onProgress?: (info: ExtractProgressInfo) => void
}
