import { describe, expect, it } from 'vitest'

import type { OcrLine, ScreenshotResidentCandidate } from '@/utils/residentScreenshotImport/types'
import { dedupe } from '@/utils/residentScreenshotImport/dedupe'
import { extractResidentsFromOcrPages } from '@/utils/residentScreenshotImport'
import { extractCandidatesFromPlainText } from '@/utils/residentScreenshotImport/extractors/plainText'
import { extractCandidatesThreeColumn } from '@/utils/residentScreenshotImport/extractors/threeColumn'
import { extractCandidatesVerticalPair } from '@/utils/residentScreenshotImport/extractors/verticalPair'
import { matchStore } from '@/utils/residentScreenshotImport/storeMatching'
import { extractResidentNameFromOcrLine } from '@/utils/residentScreenshotImport/textUtils'
import { testStores } from './fixtures/stores'

function line(text: string, bbox: OcrLine['bbox']): OcrLine {
  return { text, bbox }
}

describe('residentScreenshotImport', () => {
  describe('storeMatching.matchStore', () => {
    it('matches exact store names', () => {
      const m = matchStore('Soda Brewery', testStores)
      expect(m.storeId).toBe('soda-brewery')
      expect(m.confidence).toBe(1)
    })

    it('matches no-space variants', () => {
      const m = matchStore('SodaBrewery', testStores)
      expect(m.storeId).toBe('soda-brewery')
      expect(m.confidence).toBeGreaterThanOrEqual(0.95)
    })
  })

  describe('textUtils.extractResidentNameFromOcrLine', () => {
    it('strips trailing IDs and embedded store text', () => {
      const name = extractResidentNameFromOcrLine('Alice Wonderland Soda Brewery 12345', testStores)
      expect(name).toBe('Alice Wonderland')
    })

    it('returns empty for unemployed-ish lines', () => {
      const name = extractResidentNameFromOcrLine('UNEMPLOYED', testStores)
      expect(name).toBe('')
    })
  })

  describe('extractors.plainText', () => {
    it('extracts current+dream jobs when stores are embedded on one line', () => {
      const out = extractCandidatesFromPlainText({
        text: 'Alice Wonderland Soda Brewery Cake Studio\n',
        stores: testStores,
        sourceFileName: 'fixture.txt',
      })

      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.currentJobStoreId).toBe('soda-brewery')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
      expect(out[0]?.selected).toBe(true)
      expect(out[0]?.issues).toEqual([])
    })

    it('extracts dream job from a subsequent line', () => {
      const out = extractCandidatesFromPlainText({
        text: 'Alice Wonderland\nCake Studio\n',
        stores: testStores,
        sourceFileName: 'fixture.txt',
      })

      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
    })
  })

  describe('extractors.verticalPair', () => {
    it('extracts name + dream job from vertically paired left-side lines', () => {
      const lines: OcrLine[] = [
        line('Alice Wonderland', { x0: 80, y0: 100, x1: 400, y1: 120 }),
        line('Cake Studio', { x0: 90, y0: 150, x1: 420, y1: 170 }),
      ]

      const out = extractCandidatesVerticalPair({
        lines,
        inferredWidth: 1000,
        stores: testStores,
        sourceFileName: 'fixture.png',
      })

      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
      expect(out[0]?.selected).toBe(true)
    })
  })

  describe('extractors.threeColumn', () => {
    it('extracts name + current + dream from a three-column row', () => {
      const lines: OcrLine[] = [
        line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
        line('Soda Brewery', { x0: 480, y0: 102, x1: 680, y1: 122 }),
        line('Cake Studio', { x0: 820, y0: 101, x1: 980, y1: 121 }),
      ]

      const out = extractCandidatesThreeColumn({
        lines,
        inferredWidth: 1000,
        stores: testStores,
        sourceFileName: 'fixture.png',
      })

      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.currentJobStoreId).toBe('soda-brewery')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
      expect(out[0]?.selected).toBe(true)
      expect(out[0]?.issues).toEqual([])
    })
  })

  describe('dedupe', () => {
    it('merges duplicate candidates for the same resident', () => {
      const a: ScreenshotResidentCandidate = {
        nameRaw: 'Alice Wonderland',
        currentJobRaw: 'Soda Brewery',
        dreamJobRaw: 'Cake Studio',
        name: 'Alice Wonderland',
        currentJobStoreId: 'soda-brewery',
        dreamJobStoreId: 'cake-studio',
        matchedCurrentStoreName: 'Soda Brewery',
        matchedStoreName: 'Cake Studio',
        currentMatchConfidence: 1,
        matchConfidence: 1,
        selected: true,
        issues: [],
        sourceFileName: 'a.png',
      }

      // Simulate a common extractor swap: dream/current flipped (still same stores)
      const b: ScreenshotResidentCandidate = {
        nameRaw: 'Alice Wonderland',
        currentJobRaw: 'Cake Studio',
        dreamJobRaw: 'Soda Brewery',
        name: 'Alice Wonderland',
        currentJobStoreId: 'cake-studio',
        dreamJobStoreId: 'soda-brewery',
        matchedCurrentStoreName: 'Cake Studio',
        matchedStoreName: 'Soda Brewery',
        currentMatchConfidence: 1,
        matchConfidence: 1,
        selected: false,
        issues: ['Could not confidently match current job to a known store'],
        sourceFileName: 'b.png',
      }

      const out = dedupe([a, b])
      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      // Dedupe should not produce an "unselected" result if any input was selected
      expect(out[0]?.selected).toBe(true)
      // And it should keep a coherent dream job
      expect(out[0]?.dreamJobStoreId).toBeDefined()
    })
  })

  describe('extractResidentsFromOcrPages (fixture style)', () => {
    it('parses a multi-page OCR fixture without calling Google Vision', () => {
      const pages = [
        {
          fileName: 'fixture-1.png',
          lines: [
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
            line('Soda Brewery', { x0: 480, y0: 102, x1: 680, y1: 122 }),
            line('Cake Studio', { x0: 820, y0: 101, x1: 980, y1: 121 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.currentJobStoreId).toBe('soda-brewery')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
    })
  })
})
