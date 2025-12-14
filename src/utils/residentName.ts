function toTitleCaseSegment(segment: string): string {
  if (!segment) return segment
  const firstChar = segment.charAt(0)
  const rest = segment.slice(1)
  return `${firstChar.toUpperCase()}${rest.toLowerCase()}`
}

function toTitleCaseWord(word: string): string {
  // Handle hyphenated and apostrophe names: ANNA-MARIE, O'BRIEN
  return word
    .split('-')
    .map(part => part.split("'").map(toTitleCaseSegment).join("'"))
    .join('-')
}

export function formatResidentName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed

  return trimmed.split(' ').map(toTitleCaseWord).join(' ')
}
