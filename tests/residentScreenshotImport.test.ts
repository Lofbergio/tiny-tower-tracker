import { describe, expect, it } from 'vitest'

import { extractResidentsFromOcrPages } from '@/utils/residentScreenshotImport'
import type { OcrLine } from '@/utils/residentScreenshotImport/types'
import { testStores } from './fixtures/stores'

function line(text: string, bbox: OcrLine['bbox']): OcrLine {
  return { text, bbox }
}

describe('residentScreenshotImport', () => {
  describe('extractResidentsFromOcrPages', () => {
    it('parses a three-column layout (name | current | dream)', () => {
      // Single row: name on left, current in middle, dream on right
      const pages = [
        {
          fileName: 'fixture.png',
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
      expect(out[0]?.selected).toBe(true)
      expect(out[0]?.issues).toEqual([])
    })

    it('parses a two-column layout (current | dream) on same row', () => {
      // Name in left column, current left of dream in same cell
      const pages = [
        {
          fileName: 'fixture.png',
          lines: [
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 200, y1: 120 }),
            line('Soda Brewery', { x0: 250, y0: 100, x1: 450, y1: 120 }),
            line('Cake Studio', { x0: 600, y0: 102, x1: 900, y1: 122 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.currentJobStoreId).toBe('soda-brewery')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
    })

    it('handles "working at dream job" (same store appearing twice on one line)', () => {
      // When both current and dream are the same store, OCR often captures "STORE STORE"
      const pages = [
        {
          fileName: 'fixture.png',
          lines: [
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
            line('CAKE STUDIO CAKE STUDIO', { x0: 480, y0: 102, x1: 980, y1: 122 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(1)
      expect(out[0]?.currentJobStoreId).toBe('cake-studio')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
    })

    it('handles unemployed residents with dream job on same row', () => {
      // "UNEMPLOYED" in middle column, dream in right column
      const pages = [
        {
          fileName: 'fixture.png',
          lines: [
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
            line('UNEMPLOYED', { x0: 480, y0: 102, x1: 620, y1: 122 }),
            line('Cake Studio', { x0: 820, y0: 101, x1: 980, y1: 121 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(1)
      expect(out[0]?.name).toBe('Alice Wonderland')
      expect(out[0]?.dreamJobStoreId).toBe('cake-studio')
    })

    it('handles multiple residents in one screenshot', () => {
      // Two residents with 3-column layouts (well-separated rows)
      const pages = [
        {
          fileName: 'fixture.png',
          lines: [
            // Row 1: Alice
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
            line('Soda Brewery', { x0: 480, y0: 102, x1: 680, y1: 122 }),
            line('Cake Studio', { x0: 820, y0: 101, x1: 980, y1: 121 }),
            // Row 2: Bob (well-separated at y=200)
            line('Bob Martin', { x0: 60, y0: 200, x1: 350, y1: 220 }),
            line('Robot Store', { x0: 480, y0: 202, x1: 680, y1: 222 }),
            line('Ad Agency', { x0: 820, y0: 201, x1: 980, y1: 221 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(2)
      const alice = out.find(c => c.name === 'Alice Wonderland')
      const bob = out.find(c => c.name === 'Bob Martin')
      expect(alice).toBeDefined()
      expect(bob).toBeDefined()
      expect(alice?.dreamJobStoreId).toBe('cake-studio')
      expect(bob?.dreamJobStoreId).toBe('ad-agency')
    })

    it('deduplicates same resident across multiple pages', () => {
      const pages = [
        {
          fileName: 'page1.png',
          lines: [
            line('Alice Wonderland', { x0: 60, y0: 100, x1: 350, y1: 120 }),
            line('Soda Brewery', { x0: 480, y0: 102, x1: 680, y1: 122 }),
            line('Cake Studio', { x0: 820, y0: 101, x1: 980, y1: 121 }),
          ],
        },
        {
          fileName: 'page2.png',
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
    })

    it('returns empty array for empty pages', () => {
      const out = extractResidentsFromOcrPages({ pages: [], stores: testStores })
      expect(out).toHaveLength(0)
    })

    it('handles page with no valid lines', () => {
      const pages = [
        {
          fileName: 'fixture.png',
          lines: [
            line('Dream Jobs', { x0: 60, y0: 50, x1: 350, y1: 70 }),
            line('12345', { x0: 60, y0: 100, x1: 150, y1: 120 }),
          ],
        },
      ]

      const out = extractResidentsFromOcrPages({ pages, stores: testStores })
      expect(out).toHaveLength(0)
    })
  })
})
