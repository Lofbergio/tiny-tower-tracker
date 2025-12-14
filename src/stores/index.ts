import { APP_CONSTANTS } from '@/constants'
import type { Resident, UserData } from '@/types'
import { checkLocalStorageQuota } from '@/utils/storage'
import { validateResidentName, validateUserData } from '@/utils/validation'
import { useDebounceFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const defaultData: UserData = {
  stores: [],
  residents: [],
  missions: [],
}

export const useAppStore = defineStore('app', () => {
  const data = ref<UserData>(loadData())
  const lastSaved = ref<Date | null>(null)
  const saveError = ref<string | null>(null)

  function loadData(): UserData {
    try {
      const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const validation = validateUserData(parsed)

        if (validation.success) {
          const data = validation.data

          // Data migration: Remove currentStore field from residents (if it exists)
          data.residents = data.residents.map(r => {
            const { currentStore, ...resident } = r as Resident & { currentStore?: string }
            return resident
          })

          // Data migration: Convert old resident IDs to numeric IDs
          const idMap = new Map<string, string>()
          data.residents = data.residents.map((r, index) => {
            // If ID is not numeric, convert it
            if (isNaN(Number(r.id))) {
              const newId = String(index + 1)
              idMap.set(r.id, newId)
              return { ...r, id: newId }
            }
            return r
          })

          // Update store residents with new IDs
          if (idMap.size > 0) {
            data.stores = data.stores.map(us => ({
              ...us,
              residents: us.residents.map(residentId => idMap.get(residentId) ?? residentId),
            }))
          }

          // Clean up completed missions older than 30 days
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
          data.missions = data.missions.filter(m => {
            if (m.status === 'completed') {
              return m.addedAt > thirtyDaysAgo
            }
            return true
          })

          return data
        } else {
          console.error('Data validation failed:', validation.error)
          // Try to recover by using default data
          return { ...defaultData }
        }
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
    }
    return { ...defaultData }
  }

  function saveData() {
    try {
      // Check quota before saving
      const quota = checkLocalStorageQuota()
      if (!quota.available) {
        saveError.value = 'Storage quota exceeded. Please export and clear old data.'
        throw new Error('Storage quota exceeded')
      }

      const validation = validateUserData(data.value)
      if (!validation.success) {
        saveError.value = validation.error
        throw new Error(validation.error)
      }

      localStorage.setItem(APP_CONSTANTS.STORAGE_KEY, JSON.stringify(data.value))
      lastSaved.value = new Date()
      saveError.value = null
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
      if (!saveError.value) {
        saveError.value = 'Failed to save data'
      }
      throw error
    }
  }

  // Debounced save function
  const debouncedSave = useDebounceFn(saveData, APP_CONSTANTS.DEBOUNCE_DELAY)

  function saveDataDebounced() {
    debouncedSave()
  }

  function importData(newData: UserData) {
    const validation = validateUserData(newData)
    if (!validation.success) {
      throw new Error(validation.error)
    }
    data.value = validation.data
    saveData()
  }

  function resetData() {
    data.value = { ...defaultData }
    saveData()
  }

  return {
    data,
    lastSaved,
    saveError,
    loadData: () => {
      data.value = loadData()
    },
    saveData,
    saveDataDebounced,
    importData,
    resetData,
  }
})

export const useResidentsStore = defineStore('residents', () => {
  const appStore = useAppStore()

  const residents = computed(() => appStore.data.residents)

  function createResident(
    name: string,
    dreamJob: string
  ): {
    success: boolean
    id?: string
    error?: string
  } {
    const validation = validateResidentName(name)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    if (!dreamJob || dreamJob.trim() === '') {
      return { success: false, error: 'Dream job is required' }
    }

    // Generate numeric ID (find max ID and add 1)
    const maxId = appStore.data.residents.reduce((max, r) => {
      const numId = Number(r.id)
      return !isNaN(numId) && numId > max ? numId : max
    }, 0)
    const id = String(maxId + 1)

    appStore.data.residents.push({
      id,
      name: validation.data,
      dreamJob,
    })
    appStore.saveDataDebounced()
    return { success: true, id }
  }

  function addResident(name: string, dreamJob: string): { success: boolean; error?: string } {
    const result = createResident(name, dreamJob)
    if (!result.success) {
      return { success: false, error: result.error }
    }
    return { success: true }
  }

  function addResidentWithId(
    name: string,
    dreamJob: string
  ): { success: boolean; id?: string; error?: string } {
    return createResident(name, dreamJob)
  }

  function removeResident(residentId: string): boolean {
    const index = appStore.data.residents.findIndex(r => r.id === residentId)
    if (index !== -1) {
      // Remove from any store
      appStore.data.stores.forEach(userStore => {
        const storeIndex = userStore.residents.indexOf(residentId)
        if (storeIndex !== -1) {
          userStore.residents.splice(storeIndex, 1)
        }
      })

      appStore.data.residents.splice(index, 1)
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function updateResident(residentId: string, updates: Partial<Resident>): boolean {
    const resident = appStore.data.residents.find(r => r.id === residentId)
    if (resident) {
      // Validate name if it's being updated
      if (updates.name !== undefined) {
        const validation = validateResidentName(updates.name)
        if (!validation.success) {
          throw new Error(validation.error)
        }
        updates.name = validation.data
      }

      Object.assign(resident, updates)
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function getCurrentStore(residentId: string): string | undefined {
    const userStore = appStore.data.stores.find(us => us.residents.includes(residentId))
    return userStore?.storeId
  }

  function getResidentsNotInDreamJob() {
    return appStore.data.residents.filter(r => {
      const currentStore = getCurrentStore(r.id)
      if (!currentStore) {
        return true
      }
      return currentStore !== r.dreamJob
    })
  }

  function getResidentsForStore(storeId: string) {
    return appStore.data.residents.filter(r => r.dreamJob === storeId)
  }

  return {
    residents,
    addResident,
    addResidentWithId,
    removeResident,
    updateResident,
    getCurrentStore,
    getResidentsNotInDreamJob,
    getResidentsForStore,
  }
})

export const useStoresStore = defineStore('stores', () => {
  const appStore = useAppStore()

  const userStores = computed(() => appStore.data.stores)

  function addStore(storeId: string): boolean {
    if (appStore.data.stores.some(us => us.storeId === storeId)) {
      return false // Store already exists
    }
    appStore.data.stores.push({
      storeId,
      residents: [],
    })
    appStore.saveDataDebounced()
    return true
  }

  function removeStore(storeId: string): boolean {
    const index = appStore.data.stores.findIndex(us => us.storeId === storeId)
    if (index !== -1) {
      appStore.data.stores.splice(index, 1)
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function addResidentToStore(
    storeId: string,
    residentId: string
  ): { success: boolean; error?: string } {
    const userStore = appStore.data.stores.find(us => us.storeId === storeId)
    if (!userStore) {
      return { success: false, error: 'Store not found' }
    }
    if (userStore.residents.length >= APP_CONSTANTS.MAX_STORE_CAPACITY) {
      return { success: false, error: 'Store is full' }
    }
    if (userStore.residents.includes(residentId)) {
      return { success: false, error: 'Resident already in store' }
    }

    // Remove resident from previous store if any
    appStore.data.stores.forEach(us => {
      const index = us.residents.indexOf(residentId)
      if (index !== -1) {
        us.residents.splice(index, 1)
      }
    })

    userStore.residents.push(residentId)
    appStore.saveDataDebounced()
    return { success: true }
  }

  function removeResidentFromStore(storeId: string, residentId: string): boolean {
    const userStore = appStore.data.stores.find(us => us.storeId === storeId)
    if (!userStore) {
      return false
    }

    const index = userStore.residents.indexOf(residentId)
    if (index !== -1) {
      userStore.residents.splice(index, 1)
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function getStoreCapacity(storeId: string): number {
    const userStore = appStore.data.stores.find(us => us.storeId === storeId)
    return userStore ? userStore.residents.length : 0
  }

  function isStoreFull(storeId: string): boolean {
    return getStoreCapacity(storeId) >= APP_CONSTANTS.MAX_STORE_CAPACITY
  }

  return {
    userStores,
    addStore,
    removeStore,
    addResidentToStore,
    removeResidentFromStore,
    getStoreCapacity,
    isStoreFull,
  }
})

export const useMissionsStore = defineStore('missions', () => {
  const appStore = useAppStore()

  const userMissions = computed(() => appStore.data.missions)

  function addMission(missionId: string): boolean {
    if (appStore.data.missions.some(um => um.missionId === missionId)) {
      return false // Mission already added
    }
    appStore.data.missions.push({
      missionId,
      status: 'pending',
      addedAt: Date.now(),
    })
    appStore.saveDataDebounced()
    return true
  }

  function markMissionCompleted(missionId: string): boolean {
    const userMission = appStore.data.missions.find(um => um.missionId === missionId)
    if (userMission) {
      userMission.status = 'completed'
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function markMissionPending(missionId: string): boolean {
    const userMission = appStore.data.missions.find(um => um.missionId === missionId)
    if (userMission) {
      userMission.status = 'pending'
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  function removeMission(missionId: string): boolean {
    const index = appStore.data.missions.findIndex(um => um.missionId === missionId)
    if (index !== -1) {
      appStore.data.missions.splice(index, 1)
      appStore.saveDataDebounced()
      return true
    }
    return false
  }

  return {
    userMissions,
    addMission,
    markMissionCompleted,
    markMissionPending,
    removeMission,
  }
})
