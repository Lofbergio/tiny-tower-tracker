export function getResidentAvatarUrl(residentName: string): string {
  const seed = residentName.trim().toLowerCase().replace(/\s+/g, '-')

  // DiceBear: deterministic SVG avatars, no auth required.
  // Keeping existing background palette for continuity.
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}
