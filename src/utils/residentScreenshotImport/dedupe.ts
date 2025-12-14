import { isUnemployedText, normalizeForMatch } from './textUtils'
import type { ScreenshotResidentCandidate } from './types'

export function dedupe(candidates: ScreenshotResidentCandidate[]): ScreenshotResidentCandidate[] {
  function currentKeyFor(c: ScreenshotResidentCandidate): string {
    if (c.currentJobStoreId) return c.currentJobStoreId
    if (c.currentJobRaw) {
      if (isUnemployedText(c.currentJobRaw)) return ''
      return normalizeForMatch(c.currentJobRaw)
    }
    return ''
  }

  function dreamKeyFor(c: ScreenshotResidentCandidate): string {
    return normalizeForMatch(c.matchedStoreName ?? c.dreamJobRaw)
  }

  function baseKeyFor(c: ScreenshotResidentCandidate): string {
    return `${normalizeForMatch(c.name)}|${dreamKeyFor(c)}`
  }

  function isBetterCandidate(
    a: ScreenshotResidentCandidate,
    b: ScreenshotResidentCandidate
  ): boolean {
    const aHasId = Boolean(a.dreamJobStoreId)
    const bHasId = Boolean(b.dreamJobStoreId)
    if (aHasId !== bHasId) return aHasId

    const aIssues = a.issues?.length ?? 0
    const bIssues = b.issues?.length ?? 0
    if (aIssues !== bIssues) return aIssues < bIssues

    const aConf = typeof a.matchConfidence === 'number' ? a.matchConfidence : 0
    const bConf = typeof b.matchConfidence === 'number' ? b.matchConfidence : 0
    if (aConf !== bConf) return aConf > bConf

    const aHasCurrent = Boolean(a.currentJobStoreId || a.currentJobRaw)
    const bHasCurrent = Boolean(b.currentJobStoreId || b.currentJobRaw)
    if (aHasCurrent !== bHasCurrent) return aHasCurrent

    return false
  }

  function mergeCandidates(
    keep: ScreenshotResidentCandidate,
    incoming: ScreenshotResidentCandidate
  ): ScreenshotResidentCandidate {
    const base = isBetterCandidate(incoming, keep) ? { ...incoming } : { ...keep }
    const other = base === incoming ? keep : incoming

    base.selected = Boolean(base.selected || other.selected)

    if (!base.currentJobStoreId && other.currentJobStoreId)
      base.currentJobStoreId = other.currentJobStoreId
    if (!base.currentJobRaw && other.currentJobRaw) base.currentJobRaw = other.currentJobRaw
    if (base.currentMatchConfidence === undefined && other.currentMatchConfidence !== undefined) {
      base.currentMatchConfidence = other.currentMatchConfidence
    }
    if (!base.matchedCurrentStoreName && other.matchedCurrentStoreName) {
      base.matchedCurrentStoreName = other.matchedCurrentStoreName
    }

    if ((base.issues?.length ?? 0) === 0 && (other.issues?.length ?? 0) > 0) {
      base.issues = other.issues
    }

    return base
  }

  const grouped = new Map<string, ScreenshotResidentCandidate[]>()

  for (const c of candidates) {
    const baseKey = baseKeyFor(c)
    const list = grouped.get(baseKey) ?? []
    const cCurrentKey = currentKeyFor(c)

    let merged = false
    for (let i = 0; i < list.length; i++) {
      const existing = list[i]
      const eCurrentKey = currentKeyFor(existing)

      const compatible = eCurrentKey === cCurrentKey || eCurrentKey === '' || cCurrentKey === ''
      if (compatible) {
        list[i] = mergeCandidates(existing, c)
        merged = true
        break
      }
    }

    if (!merged) {
      list.push(c)
    }

    grouped.set(baseKey, list)
  }

  return Array.from(grouped.values()).flat()
}
