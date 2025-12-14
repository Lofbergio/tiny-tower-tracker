interface CategoryColors {
  primary: string
  light: string
  border: string
  bg: string
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) {
    return hex
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const CATEGORY_COLORS: Record<string, { light: CategoryColors; dark: CategoryColors }> = {
  food: {
    light: { primary: '#EF4444', light: '#FEE2E2', border: '#EF4444', bg: '#FEF2F2' },
    dark: { primary: '#DC2626', light: '#991B1B', border: '#DC2626', bg: '#7F1D1D' },
  },
  service: {
    light: { primary: '#3B82F6', light: '#DBEAFE', border: '#3B82F6', bg: '#EFF6FF' },
    dark: { primary: '#2563EB', light: '#1E40AF', border: '#2563EB', bg: '#1E3A8A' },
  },
  recreation: {
    light: { primary: '#A78BFA', light: '#EDE9FE', border: '#A78BFA', bg: '#F5F3FF' },
    dark: { primary: '#7C3AED', light: '#5B21B6', border: '#7C3AED', bg: '#4C1D95' },
  },
  retail: {
    light: { primary: '#EC4899', light: '#FCE7F3', border: '#EC4899', bg: '#FDF2F8' },
    dark: { primary: '#DB2777', light: '#9F1239', border: '#DB2777', bg: '#831843' },
  },
  creative: {
    light: { primary: '#F59E0B', light: '#FEF3C7', border: '#F59E0B', bg: '#FFFBEB' },
    dark: { primary: '#D97706', light: '#92400E', border: '#D97706', bg: '#78350F' },
  },
  default: {
    light: { primary: '#9CA3AF', light: '#F3F4F6', border: '#9CA3AF', bg: '#F9FAFB' },
    dark: { primary: '#6B7280', light: '#374151', border: '#6B7280', bg: '#1F2937' },
  },
}

export function getCategoryColors(category: string, isDark: boolean): CategoryColors {
  const cat = category.toLowerCase()
  const theme = isDark ? 'dark' : 'light'

  for (const [key, colors] of Object.entries(CATEGORY_COLORS)) {
    if (cat.includes(key)) {
      const selected = colors[theme]
      if (!isDark) return selected

      return {
        ...selected,
        // Use a softer tinted background in dark mode for legibility.
        bg: hexToRgba(selected.primary, 0.16),
        light: hexToRgba(selected.primary, 0.24),
      }
    }
  }

  const selected = CATEGORY_COLORS.default[theme]
  if (!isDark) return selected

  return {
    ...selected,
    bg: hexToRgba(selected.primary, 0.14),
    light: hexToRgba(selected.primary, 0.2),
  }
}

export function getCategoryEmoji(category: string): string {
  const cat = category.toLowerCase()
  if (cat.includes('food')) return '🍔'
  if (cat.includes('service')) return '🛎️'
  if (cat.includes('recreation')) return '🎮'
  if (cat.includes('retail')) return '🛍️'
  if (cat.includes('creative')) return '🎨'
  return '🏪'
}
