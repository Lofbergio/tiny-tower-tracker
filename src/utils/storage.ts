import { APP_CONSTANTS } from '@/constants'
import type { UserData } from '@/types'
import { validateUserData } from './validation'

export function exportUserData(data: UserData): void {
  try {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    link.href = url
    link.download = `tiny-tower-backup-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export data:', error)
    throw new Error('Failed to export data. Please try again.')
  }
}

// === Device Sync Utilities ===

/**
 * Encode user data to a compact string for device sync.
 * Uses base64 encoding of gzipped JSON for smaller size.
 */
export function encodeDataForSync(data: UserData): string {
  const json = JSON.stringify(data)
  // Use base64 encoding - simple and works everywhere
  return btoa(unescape(encodeURIComponent(json)))
}

/**
 * Decode sync data back to UserData.
 */
export function decodeDataFromSync(encoded: string): UserData {
  try {
    const json = decodeURIComponent(escape(atob(encoded.trim())))
    const data = JSON.parse(json)

    const validation = validateUserData(data)
    if (!validation.success) {
      throw new Error(validation.error)
    }

    return validation.data
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      throw error
    }
    throw new Error('Invalid sync data. Please check and try again.')
  }
}

/**
 * Copy data to clipboard for device sync.
 */
export async function copyDataToClipboard(data: UserData): Promise<void> {
  const encoded = encodeDataForSync(data)
  await navigator.clipboard.writeText(encoded)
}

/**
 * Import data from clipboard.
 */
export async function importDataFromClipboard(): Promise<UserData> {
  const text = await navigator.clipboard.readText()
  if (!text.trim()) {
    throw new Error('Clipboard is empty')
  }
  return decodeDataFromSync(text)
}

export function importUserData(file: File): Promise<UserData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // Validate the imported data
        const validation = validateUserData(data)
        if (!validation.success) {
          reject(new Error(validation.error))
          return
        }

        resolve(validation.data)
      } catch {
        reject(new Error('Invalid file format. Please select a valid backup file.'))
      }
    }

    reader.onerror = (error: ProgressEvent<FileReader>) => {
      console.error('File read error:', error)
      reject(new Error('Failed to read file. Please try again.'))
    }

    reader.readAsText(file)
  })
}

export function checkLocalStorageQuota(): { available: boolean; percentUsed: number } {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)

    // Estimate usage
    let total = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length
      }
    }

    // Most browsers have ~5-10MB limit, we'll use 5MB as conservative estimate
    const percentUsed = (total / APP_CONSTANTS.LOCAL_STORAGE_ESTIMATED_LIMIT) * 100

    return {
      available: percentUsed < 90,
      percentUsed,
    }
  } catch {
    return {
      available: false,
      percentUsed: 100,
    }
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear data:', err)
    throw new Error('Failed to clear data')
  }
}
