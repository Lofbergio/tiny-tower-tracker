import { APP_CONSTANTS } from '@/constants'
import { ref, watch } from 'vue'

const STORAGE_KEY = APP_CONSTANTS.THEME_STORAGE_KEY

type ThemeMode = 'light' | 'dark' | 'system'

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'system'
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isDarkForMode(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return getSystemPrefersDark()
}

function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const mode = ref<ThemeMode>(getStoredMode())
const isDark = ref(isDarkForMode(mode.value))
applyTheme(isDark.value)

watch(mode, newMode => {
  const dark = isDarkForMode(newMode)
  isDark.value = dark
  applyTheme(dark)

  if (typeof window === 'undefined') return
  if (newMode === 'system') {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, newMode)
  }
})

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (event: MediaQueryListEvent) => {
    if (mode.value !== 'system') return
    isDark.value = event.matches
    applyTheme(isDark.value)
  }

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handler)
  } else {
    // Safari < 14
    ;(
      media as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }
    ).addListener(handler)
  }
}

function setMode(newMode: ThemeMode) {
  mode.value = newMode
}

function toggle() {
  mode.value = isDark.value ? 'light' : 'dark'
}

export function useDarkMode() {
  return {
    isDark,
    toggle,
    mode,
    setMode,
  }
}
