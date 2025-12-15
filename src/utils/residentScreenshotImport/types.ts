import type { Store } from '@/types'

export type OcrBBox = { x0: number; y0: number; x1: number; y1: number }
export type OcrLine = { text: string; bbox: OcrBBox }

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
  phase: 'loading' | 'cloud'
  fileName?: string
  progress?: number
  fileIndex?: number
  fileCount?: number
}

export type ExtractResidentsFromScreenshotsParams = {
  files: File[]
  stores: Store[]
  onProgress?: (info: ExtractProgressInfo) => void
}
