import type { Store } from '@/types'

export type OcrBBox = { x0: number; y0: number; x1: number; y1: number }
export type OcrLine = { text: string; bbox: OcrBBox }

export type OcrPage = {
  fileName: string
  lines?: OcrLine[]
  text?: string
}

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

export type ExtractProgressInfo = {
  phase: 'processing'
  fileName?: string
  progress?: number // 0-1 for determinate progress, undefined for indeterminate
  fileIndex?: number
  fileCount?: number
}

export type ExtractResidentsFromScreenshotsParams = {
  files: File[]
  stores: Store[]
  onProgress?: (info: ExtractProgressInfo) => void
  onOcrPage?: (page: OcrPage) => void
}
