import { APP_CONSTANTS } from '@/constants'
import type { UserData } from '@/types'
import pako from 'pako'
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
 * Minify UserData by using short property names and index-based IDs for sync transfer.
 * This significantly reduces data size for QR codes.
 *
 * Strategy:
 * 1. Create lookup tables for storeId and missionId (many duplicates)
 * 2. Use numeric indices instead of long string IDs
 * 3. Omit redundant data (resident dreamJob can be inferred from store assignment)
 */
function minifyUserData(data: UserData): unknown {
  // Build unique ID tables
  const storeIds = [
    ...new Set([...data.stores.map(s => s.storeId), ...data.residents.map(r => r.dreamJob)]),
  ]
  const missionIds = [...new Set(data.missions.map(m => m.missionId))]

  // Create index mappings
  const storeIdToIndex = new Map(storeIds.map((id, i) => [id, i]))
  const missionIdToIndex = new Map(missionIds.map((id, i) => [id, i]))

  // Use base timestamp for delta encoding of mission times
  const baseTime = data.missions.length > 0 ? Math.min(...data.missions.map(m => m.addedAt)) : 0

  // Convert resident IDs to numbers (remove "res-" prefix if present, otherwise parse)
  const residentIdToNumber = (id: string): number => {
    const numMatch = id.match(/\d+/)
    return numMatch ? parseInt(numMatch[0], 10) : parseInt(id, 10) || 0
  }

  return {
    // ID lookup tables (only included once)
    si: storeIds,
    mi: missionIds,
    bt: baseTime, // Base timestamp for delta encoding
    // Stores: [storeIndex, [residentNumericIds]]
    s: data.stores.map(store => [
      storeIdToIndex.get(store.storeId)!,
      store.residents.map(residentIdToNumber),
    ]),
    // Residents: [numericId, dreamJobIndex]
    // Names omitted for QR code size - regenerated as "Resident N" on import
    r: data.residents.map(resident => [
      residentIdToNumber(resident.id),
      storeIdToIndex.get(resident.dreamJob)!,
    ]),
    // Missions: [missionIndex, status, timeDelta]
    m: data.missions.map(mission => [
      missionIdToIndex.get(mission.missionId)!,
      mission.status === 'completed' ? 1 : 0,
      mission.addedAt - baseTime,
    ]),
  }
}

/**
 * Expand minified data back to full UserData format.
 */
function expandUserData(
  minified:
    | {
        si: string[]
        mi: string[]
        bt: number
        s: Array<[number, number[]]>
        r: Array<[number, number]>
        m: Array<[number, number, number]>
      }
    | {
        // Legacy v2 format (string IDs, no delta encoding)
        si: string[]
        mi: string[]
        s: Array<[number, string[]]>
        r: Array<[string, string, number]>
        m: Array<[number, number, number]>
      }
    | {
        // Legacy v1 format support
        s: Array<{ i: string; r: string[] }>
        r: Array<{ i: string; n: string; d: string }>
        m: Array<{ i: string; s: number; a: number }>
      },
): UserData {
  // Check if it's the new array format or legacy object format
  if ('si' in minified) {
    // Check if it has base time (v3 format with numeric IDs and delta encoding)
    if ('bt' in minified) {
      return {
        stores: minified.s.map(([storeIndex, residentNums]) => ({
          storeId: minified.si[storeIndex],
          residents: residentNums.map(num => String(num)),
        })),
        residents: minified.r.map(([numId, dreamJobIndex], index) => ({
          id: String(numId),
          name: `Resident ${index + 1}`, // Auto-generated name
          dreamJob: minified.si[dreamJobIndex],
        })),
        missions: minified.m.map(([missionIndex, status, timeDelta]) => ({
          missionId: minified.mi[missionIndex],
          status: status === 1 ? 'completed' : 'pending',
          addedAt: minified.bt + timeDelta,
        })),
      }
    }

    // Legacy v2 format with string IDs
    return {
      stores: minified.s.map(([storeIndex, residents]) => ({
        storeId: minified.si[storeIndex],
        residents: residents as string[],
      })),
      residents: minified.r.map(([id, name, dreamJobIndex]) => ({
        id: id as string,
        name,
        dreamJob: minified.si[dreamJobIndex],
      })),
      missions: minified.m.map(([missionIndex, status, addedAt]) => ({
        missionId: minified.mi[missionIndex],
        status: status === 1 ? 'completed' : 'pending',
        addedAt,
      })),
    }
  }

  // Legacy v1 format with objects
  return {
    stores: minified.s.map(store => ({
      storeId: store.i,
      residents: store.r,
    })),
    residents: minified.r.map(resident => ({
      id: resident.i,
      name: resident.n,
      dreamJob: resident.d,
    })),
    missions: minified.m.map(mission => ({
      missionId: mission.i,
      status: mission.s === 1 ? 'completed' : 'pending',
      addedAt: mission.a,
    })),
  }
}

/**
 * Encode user data to a compact string for device sync.
 * Uses gzip compression + base64 encoding for minimal size.
 * Data is minified before compression for maximum efficiency.
 */
export function encodeDataForSync(data: UserData): string {
  // Minify data to use short property names
  const minified = minifyUserData(data)
  const json = JSON.stringify(minified)

  // Compress using gzip
  const compressed = pako.gzip(json)

  // Convert to base64 for safe text transfer
  let binary = ''
  const len = compressed.length
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressed[i])
  }
  return btoa(binary)
}

/**
 * Decode sync data back to UserData.
 * Handles both legacy (uncompressed) and new (compressed) formats.
 */
export function decodeDataFromSync(encoded: string): UserData {
  try {
    const trimmed = encoded.trim()

    // Try to decode from base64
    const binaryString = atob(trimmed)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    let data: UserData | null = null

    // Try to decompress (new format)
    try {
      const decompressed = pako.ungzip(bytes, { to: 'string' })
      const minified = JSON.parse(decompressed)
      data = expandUserData(minified)
    } catch {
      // Not gzipped - try legacy format (plain JSON in base64)
      try {
        const json = decodeURIComponent(escape(binaryString))
        data = JSON.parse(json)
      } catch {
        throw new Error('Invalid sync data format')
      }
    }

    // Validate the data
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
