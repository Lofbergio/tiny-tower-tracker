import { isUnemployedText, normalizeForMatch } from './textUtils'
import type { ScreenshotResidentCandidate } from './types'

export function dedupe(candidates: ScreenshotResidentCandidate[]): ScreenshotResidentCandidate[] {
  function nameKeyFor(c: ScreenshotResidentCandidate): string {
    return normalizeForMatch(c.name)
  }

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

  function hasMeaningfulCurrent(c: ScreenshotResidentCandidate): boolean {
    if (c.currentJobStoreId) return true
    if (!c.currentJobRaw) return false
    return !isUnemployedText(c.currentJobRaw)
  }

  function shouldMerge(a: ScreenshotResidentCandidate, b: ScreenshotResidentCandidate): boolean {
    const aDream = dreamKeyFor(a)
    const bDream = dreamKeyFor(b)
    const aCurrent = currentKeyFor(a)
    const bCurrent = currentKeyFor(b)

    if (aDream && bDream && aDream === bDream) return true

    // Same explicit current job match.
    if (aCurrent && bCurrent && aCurrent === bCurrent) return true

    // Cross-match: one extractor sometimes mis-assigns current job as dream job.
    if (aDream && bCurrent && aDream === bCurrent) return true
    if (aCurrent && bDream && aCurrent === bDream) return true

    return false
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

    // Prefer a matched dream job (storeId) and higher confidence when merging.
    if (!base.dreamJobStoreId && other.dreamJobStoreId) base.dreamJobStoreId = other.dreamJobStoreId
    if (!base.dreamJobRaw && other.dreamJobRaw) base.dreamJobRaw = other.dreamJobRaw
    if (!base.matchedStoreName && other.matchedStoreName)
      base.matchedStoreName = other.matchedStoreName
    if (
      typeof base.matchConfidence !== 'number' ||
      (typeof other.matchConfidence === 'number' && other.matchConfidence > base.matchConfidence)
    ) {
      base.matchConfidence = other.matchConfidence
    }

    // Prefer a meaningful current job over UNEMPLOYED/empty.
    if (!base.currentJobStoreId && other.currentJobStoreId)
      base.currentJobStoreId = other.currentJobStoreId
    if (!base.currentJobRaw && other.currentJobRaw) base.currentJobRaw = other.currentJobRaw
    if (base.currentJobRaw && isUnemployedText(base.currentJobRaw) && hasMeaningfulCurrent(other)) {
      base.currentJobRaw = other.currentJobRaw
      if (other.currentJobStoreId) base.currentJobStoreId = other.currentJobStoreId
    }
    if (base.currentMatchConfidence === undefined && other.currentMatchConfidence !== undefined) {
      base.currentMatchConfidence = other.currentMatchConfidence
    }
    if (!base.matchedCurrentStoreName && other.matchedCurrentStoreName) {
      base.matchedCurrentStoreName = other.matchedCurrentStoreName
    }

    // Keep issues minimal: if base has none, don't add more; otherwise union unique issues.
    const baseIssues = base.issues ?? []
    const otherIssues = other.issues ?? []
    if (baseIssues.length === 0) {
      // no-op
    } else if (otherIssues.length > 0) {
      const merged = new Set<string>(baseIssues)
      for (const issue of otherIssues) merged.add(issue)
      base.issues = Array.from(merged)
    }

    return base
  }

  const grouped = new Map<string, ScreenshotResidentCandidate[]>()

  for (const c of candidates) {
    const nameKey = nameKeyFor(c)
    const list = grouped.get(nameKey) ?? []

    let merged = false
    for (let i = 0; i < list.length; i++) {
      const existing = list[i]

      if (shouldMerge(existing, c)) {
        list[i] = mergeCandidates(existing, c)
        merged = true
        break
      }
    }

    if (!merged) {
      list.push(c)
    }

    grouped.set(nameKey, list)
  }

  return Array.from(grouped.values()).flat()
}
