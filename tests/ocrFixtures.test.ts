import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import type { Store } from '@/types'
import { extractResidentsFromOcrPages } from '@/utils/residentScreenshotImport'
import type { OcrLine, OcrPage } from '@/utils/residentScreenshotImport/types'

function loadAllStores(): Store[] {
  const filePath = path.resolve(process.cwd(), 'public/db-store.json')
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as Store[]
}

function loadOcrFixtures(): Array<{ fileName: string; page: OcrPage }> {
  const dir = path.resolve(process.cwd(), 'tests/fixtures/ocr')
  if (!fs.existsSync(dir)) return []

  const files = fs
    .readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))

  return files.map(fileName => {
    const fullPath = path.join(dir, fileName)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const data = JSON.parse(raw) as { text?: string; lines?: OcrLine[] }

    return {
      fileName,
      page: {
        fileName,
        text: data.text,
        lines: data.lines,
      },
    }
  })
}

describe('OCR fixtures (golden)', () => {
  it('keeps parsing stable for all saved fixtures', () => {
    const stores = loadAllStores()
    const fixtures = loadOcrFixtures()

    // If you don’t have fixtures yet, this test is a no-op.
    // Add fixtures under tests/fixtures/ocr/*.json and run `yarn test:update`.
    if (fixtures.length === 0) {
      expect(fixtures).toHaveLength(0)
      return
    }

    const results = fixtures.map(({ fileName, page }) => {
      const candidates = extractResidentsFromOcrPages({ pages: [page], stores })
        .map(c => ({
          name: c.name,
          currentJobStoreId: c.currentJobStoreId ?? null,
          dreamJobStoreId: c.dreamJobStoreId ?? null,
          issues: c.issues,
          selected: c.selected,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      return { fileName, candidates }
    })

    // Expected values live in `tests/__snapshots__/ocrFixtures.test.ts.snap`.
    // Update them with: `yarn test:update`.
    expect(results).toMatchSnapshot()
  })
})
