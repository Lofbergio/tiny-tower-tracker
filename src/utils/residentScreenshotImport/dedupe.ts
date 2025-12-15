import { isUnemployedText, normalizeForMatch } from './textUtils'
import type { ScreenshotResidentCandidate } from './types'

export function dedupe(candidates: ScreenshotResidentCandidate[]): ScreenshotResidentCandidate[] {
  function nameKeyFor(c: ScreenshotResidentCandidate): string {
    return normalizeForMatch(c.name)
  }

  function rawKey(input?: string): string {
    return input ? normalizeForMatch(input) : ''
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
    // Since candidates are already grouped by name, we should merge unless there are conflicts.
    const aDreamId = a.dreamJobStoreId
    const bDreamId = b.dreamJobStoreId
    const aCurrentId = a.currentJobStoreId
    const bCurrentId = b.currentJobStoreId

    // If we have any matching store IDs, definitely merge
    if (aDreamId && bDreamId && aDreamId === bDreamId) return true
    if (aCurrentId && bCurrentId && aCurrentId === bCurrentId) return true

    // Cross-match: one extractor sometimes mis-assigns current job as dream job (or vice versa)
    if (aDreamId && bCurrentId && aDreamId === bCurrentId) return true
    if (aCurrentId && bDreamId && aCurrentId === bDreamId) return true

    // If dream IDs conflict but one matches the other's current job, merge; otherwise treat as a potential real conflict.
    if (aDreamId && bDreamId && aDreamId !== bDreamId) {
      const aHasCurrent = hasMeaningfulCurrent(a)
      const bHasCurrent = hasMeaningfulCurrent(b)

      // If either side has no meaningful current job, it's very likely a partial OCR duplicate.
      if (!aHasCurrent || !bHasCurrent) return true

      // If both have meaningful current jobs and those conflict too, avoid merging to prevent collapsing distinct residents.
      if (aCurrentId && bCurrentId && aCurrentId !== bCurrentId) return false
    }

    // Text-based matching for when store IDs aren't available
    const aDream = dreamKeyFor(a)
    const bDream = dreamKeyFor(b)
    const aCurrent = currentKeyFor(a)
    const bCurrent = currentKeyFor(b)

    // Same dream job text
    if (aDream && bDream && aDream === bDream) return true

    // Same explicit current job match
    if (aCurrent && bCurrent && aCurrent === bCurrent) return true

    // Cross-match: one extractor sometimes mis-assigns current job as dream job
    if (aDream && bCurrent && aDream === bCurrent) return true
    if (aCurrent && bDream && aCurrent === bDream) return true

    // If one candidate has information and the other is mostly empty, merge them
    // This catches cases where OCR picked up the same person but with partial info
    const aHasInfo = Boolean(aDreamId || aDream || aCurrentId || aCurrent)
    const bHasInfo = Boolean(bDreamId || bDream || bCurrentId || bCurrent)

    // If one has no job info at all, merge (it's likely a poor OCR read)
    if (!aHasInfo || !bHasInfo) return true

    // If both have dream jobs but one is missing current job, merge
    if ((aDreamId || aDream) && (bDreamId || bDream)) {
      if (!aCurrent && !bCurrent) return true // Both have dream, neither has current
      if (!aCurrent || !bCurrent) return true // One missing current
    }

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

    // Resolve the common extractor error where a resident's current job is captured as their dream job.
    // If both sides have dream IDs but they differ, and one side's dream matches the other side's current,
    // prefer the dream job from the candidate whose dream does NOT look like a current job.
    {
      const baseDreamId = base.dreamJobStoreId
      const otherDreamId = other.dreamJobStoreId
      const baseCurrentId = base.currentJobStoreId
      const otherCurrentId = other.currentJobStoreId

      if (baseDreamId && otherDreamId && baseDreamId !== otherDreamId) {
        const baseDreamLooksLikeCurrent = Boolean(otherCurrentId && baseDreamId === otherCurrentId)
        const otherDreamLooksLikeCurrent = Boolean(baseCurrentId && otherDreamId === baseCurrentId)

        const baseDreamKey = dreamKeyFor(base)
        const otherDreamKey = dreamKeyFor(other)
        const baseCurrentKey = currentKeyFor(base)
        const otherCurrentKey = currentKeyFor(other)

        const baseDreamTextLooksLikeCurrent = Boolean(
          otherCurrentKey && baseDreamKey && baseDreamKey === otherCurrentKey
        )
        const otherDreamTextLooksLikeCurrent = Boolean(
          baseCurrentKey && otherDreamKey && otherDreamKey === baseCurrentKey
        )

        const shouldPreferOtherDream =
          (baseDreamLooksLikeCurrent || baseDreamTextLooksLikeCurrent) &&
          !(otherDreamLooksLikeCurrent || otherDreamTextLooksLikeCurrent)

        if (shouldPreferOtherDream) {
          base.dreamJobStoreId = other.dreamJobStoreId
          if (other.dreamJobRaw) base.dreamJobRaw = other.dreamJobRaw
          if (other.matchedStoreName) base.matchedStoreName = other.matchedStoreName
          if (
            typeof other.matchConfidence === 'number' &&
            (typeof base.matchConfidence !== 'number' ||
              other.matchConfidence > base.matchConfidence)
          ) {
            base.matchConfidence = other.matchConfidence
          }
        }
      }

      // Also handle the case where IDs aren't available but the raw text indicates a swap.
      const baseDreamText = rawKey(base.matchedStoreName ?? base.dreamJobRaw)
      const otherDreamText = rawKey(other.matchedStoreName ?? other.dreamJobRaw)
      const baseCurrentText = rawKey(base.matchedCurrentStoreName ?? base.currentJobRaw)
      const otherCurrentText = rawKey(other.matchedCurrentStoreName ?? other.currentJobRaw)

      if (baseDreamText && otherDreamText && baseDreamText !== otherDreamText) {
        const shouldPreferOtherDreamText =
          otherCurrentText &&
          baseDreamText === otherCurrentText &&
          !(baseCurrentText && otherDreamText === baseCurrentText)

        if (shouldPreferOtherDreamText) {
          if (other.dreamJobRaw) base.dreamJobRaw = other.dreamJobRaw
          if (other.matchedStoreName) base.matchedStoreName = other.matchedStoreName
          if (
            typeof other.matchConfidence === 'number' &&
            (typeof base.matchConfidence !== 'number' ||
              other.matchConfidence > base.matchConfidence)
          ) {
            base.matchConfidence = other.matchConfidence
          }
        }
      }
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
