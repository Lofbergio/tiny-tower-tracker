import { computed, ref } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import type { Store, UserStore } from '@/types'

const allStores = ref<Store[]>([])

export async function loadStores() {
  try {
    const response = await fetch('/db-store.json')
    allStores.value = await response.json()
  } catch (error) {
    console.error('Failed to load stores:', error)
  }
}

export function useStores() {
  const { data } = useLocalStorage()

  const userStores = computed(() => {
    return data.value.stores.map(us => {
      const store = allStores.value.find(s => s.id === us.storeId)
      return {
        ...us,
        store,
      }
    }).filter(us => us.store) as (UserStore & { store: Store })[]
  })

  function addStore(storeId: string) {
    if (data.value.stores.some(us => us.storeId === storeId)) {
      return false // Store already exists
    }
    data.value.stores.push({
      storeId,
      residents: [],
    })
    return true
  }

  function removeStore(storeId: string) {
    const index = data.value.stores.findIndex(us => us.storeId === storeId)
    if (index !== -1) {
      // Remove residents from this store
      const store = data.value.stores[index]
      store.residents.forEach(residentId => {
        const resident = data.value.residents.find(r => r.id === residentId)
        if (resident) {
          resident.currentStore = undefined
        }
      })
      data.value.stores.splice(index, 1)
      return true
    }
    return false
  }

  function addResidentToStore(storeId: string, residentId: string) {
    const userStore = data.value.stores.find(us => us.storeId === storeId)
    if (!userStore) return false
    if (userStore.residents.length >= 3) return false
    if (userStore.residents.includes(residentId)) return false

    // Remove resident from previous store if any
    const resident = data.value.residents.find(r => r.id === residentId)
    if (resident?.currentStore) {
      const prevStore = data.value.stores.find(us => us.storeId === resident.currentStore)
      if (prevStore) {
        const prevIndex = prevStore.residents.indexOf(residentId)
        if (prevIndex !== -1) {
          prevStore.residents.splice(prevIndex, 1)
        }
      }
    }

    userStore.residents.push(residentId)
    if (resident) {
      resident.currentStore = storeId
    }
    return true
  }

  function removeResidentFromStore(storeId: string, residentId: string) {
    const userStore = data.value.stores.find(us => us.storeId === storeId)
    if (!userStore) return false

    const index = userStore.residents.indexOf(residentId)
    if (index !== -1) {
      userStore.residents.splice(index, 1)
      const resident = data.value.residents.find(r => r.id === residentId)
      if (resident) {
        resident.currentStore = undefined
      }
      return true
    }
    return false
  }

  function getStoreCapacity(storeId: string) {
    const userStore = data.value.stores.find(us => us.storeId === storeId)
    return userStore ? userStore.residents.length : 0
  }

  function isStoreFull(storeId: string) {
    return getStoreCapacity(storeId) >= 3
  }

  return {
    allStores,
    userStores,
    addStore,
    removeStore,
    addResidentToStore,
    removeResidentFromStore,
    getStoreCapacity,
    isStoreFull,
  }
}

