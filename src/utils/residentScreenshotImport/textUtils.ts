import type { Store } from '@/types'

export function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeForNoSpaceMatch(input: string): string {
  return normalizeForMatch(input).replace(/\s+/g, '')
}

export function stripTrailingNumericId(input: string): string {
  return input.replace(/\s+\d{3,}\s*$/, '').trim()
}

export function sanitizeResidentName(input: string): string {
  const cleaned = stripTrailingNumericId(
    input
      .replace(/[’]/g, "'")
      .replace(/[^a-zA-Z0-9\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )

  return cleaned
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return dp[a.length][b.length]
}

export function similarity(a: string, b: string): number {
  const aa = normalizeForMatch(a)
  const bb = normalizeForMatch(b)
  if (!aa || !bb) return 0
  const dist = levenshteinDistance(aa, bb)
  const denom = Math.max(aa.length, bb.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

export function similarityNoSpace(a: string, b: string): number {
  const aa = normalizeForNoSpaceMatch(a)
  const bb = normalizeForNoSpaceMatch(b)
  if (!aa || !bb) return 0
  const dist = levenshteinDistance(aa, bb)
  const denom = Math.max(aa.length, bb.length)
  return denom === 0 ? 0 : 1 - dist / denom
}

export function collapseImmediateDuplicateNoSpace(input: string): string | undefined {
  const noSpace = normalizeForNoSpaceMatch(input)
  if (noSpace.length < 8) return undefined
  if (noSpace.length % 2 !== 0) return undefined
  const half = noSpace.length / 2
  const a = noSpace.slice(0, half)
  const b = noSpace.slice(half)
  if (a === b) return a
  return undefined
}

export function isUnemployedText(text: string): boolean {
  const t = normalizeForNoSpaceMatch(text)
  if (!t) return false
  if (t === 'unemployed') return true
  if (t.includes('unemploy') || t.includes('nemploy') || t.includes('employ')) return true
  return similarityNoSpace(t, 'unemployed') >= 0.6
}

export function looksLikeHeaderOrNoise(text: string): boolean {
  const t = normalizeForMatch(text)
  if (!t) return true
  if (t.includes('dream jobs') || t === 'job' || t.includes('dream')) return true
  if (/^[0-9\s]+$/.test(t)) return true
  return false
}

export function isLikelyName(text: string): boolean {
  const cleaned = sanitizeResidentName(text)
  if (!cleaned) return false
  if (isUnemployedText(cleaned) || isUnemployedText(text)) return false
  if (cleaned.length < 3) return false
  if (/\d/.test(cleaned)) return false
  if (!cleaned.includes(' ') && cleaned.length < 6) return false
  return true
}

export function isLikelyStoreName(text: string): boolean {
  const t = normalizeForMatch(text)
  if (!t) return false
  if (t.length < 3) return false
  if (isUnemployedText(t) || isUnemployedText(text)) return false
  if (/^[0-9\s]+$/.test(t)) return false
  return true
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractResidentNameFromOcrLine(raw: string, storesList?: Store[]): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const trimmedCollapsed = trimmed.replace(/\s+/g, ' ')

  function indexOfIgnoreCase(haystack: string, needle: string): number {
    const h = haystack.toLowerCase()
    const n = needle.toLowerCase()
    return n ? h.indexOf(n) : -1
  }

  let cutIndex = -1
  const unemployedMatch = /\bunemployed\b/i.exec(trimmed)
  if (unemployedMatch?.index !== undefined && unemployedMatch.index > 0) {
    cutIndex = unemployedMatch.index
  }

  if (cutIndex === -1 && storesList) {
    for (const store of storesList) {
      const words = store.name.trim().split(/\s+/).filter(Boolean)
      if (words.length === 0) continue
      const pattern = `\\b${words.map(escapeRegExp).join('\\\\s+')}\\b`
      const re = new RegExp(pattern, 'i')
      const m = re.exec(trimmed)
      if (m?.index !== undefined && m.index > 0) {
        if (cutIndex === -1 || m.index < cutIndex) cutIndex = m.index
      }

      // Fallback for OCR oddities where word boundaries/spacing break the regex.
      // This intentionally uses a simple substring match to avoid missing obvious cases.
      const idxExact = indexOfIgnoreCase(trimmed, store.name)
      if (idxExact > 0) {
        if (cutIndex === -1 || idxExact < cutIndex) cutIndex = idxExact
      }
      const storeCollapsed = store.name.trim().replace(/\s+/g, ' ')
      const idxCollapsed = indexOfIgnoreCase(trimmedCollapsed, storeCollapsed)
      if (idxCollapsed > 0) {
        if (cutIndex === -1 || idxCollapsed < cutIndex) cutIndex = idxCollapsed
      }
    }
  }

  const firstDigit = trimmed.search(/\d/)
  if (firstDigit > 0) {
    cutIndex = cutIndex === -1 ? firstDigit : Math.min(cutIndex, firstDigit)
  }
  const letterDigits = /\b[a-zA-Z]\d{2,}\b/.exec(trimmed)
  if (letterDigits?.index !== undefined && letterDigits.index > 0) {
    cutIndex = cutIndex === -1 ? letterDigits.index : Math.min(cutIndex, letterDigits.index)
  }

  const candidate = (cutIndex > 0 ? trimmed.slice(0, cutIndex) : trimmed).trim()
  const name = sanitizeResidentName(candidate)
  return isUnemployedText(name) ? '' : name
}
