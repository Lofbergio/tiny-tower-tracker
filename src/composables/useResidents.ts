import { computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import type { Resident } from '@/types'

export function useResidents() {
  const { data } = useLocalStorage()

  const residents = computed(() => data.value.residents)

  function addResident(name: string, dreamJob: string) {
    const id = `resident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    data.value.residents.push({
      id,
      name,
      dreamJob,
    })
    return id
  }

  function removeResident(residentId: string) {
    const index = data.value.residents.findIndex(r => r.id === residentId)
    if (index !== -1) {
      const resident = data.value.residents[index]
      
      // Remove from store if placed
      if (resident.currentStore) {
        const userStore = data.value.stores.find(us => us.storeId === resident.currentStore)
        if (userStore) {
          const storeIndex = userStore.residents.indexOf(residentId)
          if (storeIndex !== -1) {
            userStore.residents.splice(storeIndex, 1)
          }
        }
      }
      
      data.value.residents.splice(index, 1)
      return true
    }
    return false
  }

  function updateResident(residentId: string, updates: Partial<Resident>) {
    const resident = data.value.residents.find(r => r.id === residentId)
    if (resident) {
      Object.assign(resident, updates)
      return true
    }
    return false
  }

  function getResidentsByDreamJob(storeId: string) {
    return data.value.residents.filter(r => r.dreamJob === storeId)
  }

  function getResidentsNotInDreamJob() {
    return data.value.residents.filter(r => {
      if (!r.currentStore) return true
      return r.currentStore !== r.dreamJob
    })
  }

  function getResidentsForStore(storeId: string) {
    return data.value.residents.filter(r => r.dreamJob === storeId)
  }

  return {
    residents,
    addResident,
    removeResident,
    updateResident,
    getResidentsByDreamJob,
    getResidentsNotInDreamJob,
    getResidentsForStore,
  }
}

