import { useDarkMode } from '@/composables/useDarkMode'

export function getCategoryColors(category: string) {
  const { isDark } = useDarkMode()
  const cat = category.toLowerCase()

  if (cat.includes('food')) {
    return {
      primary: isDark.value ? '#DC2626' : '#EF4444',
      light: isDark.value ? '#991B1B' : '#FEE2E2',
      border: isDark.value ? '#DC2626' : '#EF4444',
      bg: isDark.value ? '#7F1D1D' : '#FEF2F2',
    }
  }
  if (cat.includes('service')) {
    return {
      primary: isDark.value ? '#2563EB' : '#3B82F6',
      light: isDark.value ? '#1E40AF' : '#DBEAFE',
      border: isDark.value ? '#2563EB' : '#3B82F6',
      bg: isDark.value ? '#1E3A8A' : '#EFF6FF',
    }
  }
  if (cat.includes('recreation')) {
    return {
      primary: isDark.value ? '#7C3AED' : '#A78BFA',
      light: isDark.value ? '#5B21B6' : '#EDE9FE',
      border: isDark.value ? '#7C3AED' : '#A78BFA',
      bg: isDark.value ? '#4C1D95' : '#F5F3FF',
    }
  }
  if (cat.includes('retail')) {
    return {
      primary: isDark.value ? '#DB2777' : '#EC4899',
      light: isDark.value ? '#9F1239' : '#FCE7F3',
      border: isDark.value ? '#DB2777' : '#EC4899',
      bg: isDark.value ? '#831843' : '#FDF2F8',
    }
  }
  if (cat.includes('creative')) {
    return {
      primary: isDark.value ? '#D97706' : '#F59E0B',
      light: isDark.value ? '#92400E' : '#FEF3C7',
      border: isDark.value ? '#D97706' : '#F59E0B',
      bg: isDark.value ? '#78350F' : '#FFFBEB',
    }
  }
  return {
    primary: isDark.value ? '#6B7280' : '#9CA3AF',
    light: isDark.value ? '#374151' : '#F3F4F6',
    border: isDark.value ? '#6B7280' : '#9CA3AF',
    bg: isDark.value ? '#1F2937' : '#F9FAFB',
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
