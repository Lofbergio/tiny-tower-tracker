import type { TesseractLine } from './types'

export function columnForLine(
  line: TesseractLine,
  inferredWidth: number
): 'left' | 'middle' | 'right' {
  const x = line.bbox.x0
  const w = Math.max(1, inferredWidth)

  if (x < w * 0.42) return 'left'
  if (x < w * 0.72) return 'middle'
  return 'right'
}

export function splitRowIntoColumns(params: {
  rowLines: TesseractLine[]
  inferredWidth: number
}): Array<{ lines: TesseractLine[] }> {
  const { rowLines, inferredWidth } = params
  const lines = rowLines.filter(l => l.text.trim() !== '')
  if (lines.length === 0) return []

  const sortedByX = [...lines].sort((a, b) => a.bbox.x0 - b.bbox.x0)
  const xs = sortedByX.map(l => l.bbox.x0)

  const gaps: Array<{ idx: number; gap: number }> = []
  for (let i = 1; i < xs.length; i++) {
    gaps.push({ idx: i, gap: xs[i] - xs[i - 1] })
  }

  const gapThreshold = Math.max(70, inferredWidth * 0.12)
  const bigGaps = gaps.filter(g => g.gap >= gapThreshold).sort((a, b) => b.gap - a.gap)

  if (bigGaps.length >= 2) {
    const split1Idx = Math.min(bigGaps[0].idx, bigGaps[1].idx)
    const split2Idx = Math.max(bigGaps[0].idx, bigGaps[1].idx)
    const split1 = (xs[split1Idx - 1] + xs[split1Idx]) / 2
    const split2 = (xs[split2Idx - 1] + xs[split2Idx]) / 2

    const c1: TesseractLine[] = []
    const c2: TesseractLine[] = []
    const c3: TesseractLine[] = []
    for (const l of lines) {
      if (l.bbox.x0 < split1) c1.push(l)
      else if (l.bbox.x0 < split2) c2.push(l)
      else c3.push(l)
    }
    return [{ lines: c1 }, { lines: c2 }, { lines: c3 }]
  }

  if (bigGaps.length === 1) {
    const splitIdx = bigGaps[0].idx
    const split = (xs[splitIdx - 1] + xs[splitIdx]) / 2
    const left: TesseractLine[] = []
    const right: TesseractLine[] = []
    for (const l of lines) {
      if (l.bbox.x0 < split) left.push(l)
      else right.push(l)
    }
    return [{ lines: left }, { lines: right }]
  }

  const left: TesseractLine[] = []
  const middle: TesseractLine[] = []
  const right: TesseractLine[] = []
  for (const l of lines) {
    const col = columnForLine(l, inferredWidth)
    if (col === 'left') left.push(l)
    if (col === 'middle') middle.push(l)
    if (col === 'right') right.push(l)
  }
  return [{ lines: left }, { lines: middle }, { lines: right }]
}

export function groupLinesIntoRows(
  lines: TesseractLine[]
): Array<{ y0: number; lines: TesseractLine[] }> {
  const sorted = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0)
  const rows: Array<{ y0: number; lines: TesseractLine[] }> = []

  const heights = sorted
    .map(l => Math.max(0, l.bbox.y1 - l.bbox.y0))
    .filter(h => h > 0)
    .sort((a, b) => a - b)
  const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 0
  const clusterThreshold = Math.max(26, Math.round(medianHeight * 1.6))

  for (const line of sorted) {
    const last = rows[rows.length - 1]
    if (!last) {
      rows.push({ y0: line.bbox.y0, lines: [line] })
      continue
    }

    if (Math.abs(line.bbox.y0 - last.y0) <= clusterThreshold) {
      last.lines.push(line)
    } else {
      rows.push({ y0: line.bbox.y0, lines: [line] })
    }
  }

  return rows
}
