import { ref, watch } from 'vue'
import type { UserData } from '@/types'

const STORAGE_KEY = 'tiny-tower-tracker-data'

const defaultData: UserData = {
  stores: [],
  residents: [],
  missions: [],
}

export function useLocalStorage() {
  const data = ref<UserData>(loadData())

  function loadData(): UserData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
    }
    return { ...defaultData }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
    }
  }

  watch(
    data,
    () => {
      saveData()
    },
    { deep: true }
  )

  return {
    data,
    saveData,
    loadData: () => {
      data.value = loadData()
    },
  }
}
