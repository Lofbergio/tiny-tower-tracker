export const APP_CONSTANTS = {
  // Store capacity
  MAX_STORE_CAPACITY: 3,

  // Storage keys
  STORAGE_KEY: 'tiny-tower-tracker-data',
  THEME_STORAGE_KEY: 'tiny-tower-tracker-theme',

  // Data files
  STORES_DATA_URL: '/db-store.json',
  MISSIONS_DATA_URL: '/db-mission.json',

  // Validation limits
  MAX_RESIDENT_NAME_LENGTH: 50,
  MIN_RESIDENT_NAME_LENGTH: 1,

  // UI constants
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 500,

  // Query keys
  QUERY_KEYS: {
    STORES: 'stores',
    MISSIONS: 'missions',
  },
} as const

export type AppConstants = typeof APP_CONSTANTS
