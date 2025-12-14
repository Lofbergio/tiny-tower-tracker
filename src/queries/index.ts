import { APP_CONSTANTS } from '@/constants'
import { useMissionsStore, useStoresStore } from '@/stores'
import type { Mission, Store, UserStore } from '@/types'
import { canCompleteMission, getCompletableMissions } from '@/utils/missionMatcher'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

async function fetchStores(): Promise<Store[]> {
  const response = await fetch(APP_CONSTANTS.STORES_DATA_URL)
  if (!response.ok) {
    throw new Error('Failed to load stores')
  }
  return response.json()
}

async function fetchMissions(): Promise<Mission[]> {
  const response = await fetch(APP_CONSTANTS.MISSIONS_DATA_URL)
  if (!response.ok) {
    throw new Error('Failed to load missions')
  }
  return response.json()
}

export function useStoresQuery() {
  return useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.STORES],
    queryFn: fetchStores,
    staleTime: Infinity, // Static data, never refetch
    gcTime: Infinity, // Keep in cache forever
  })
}

export function useMissionsQuery() {
  return useQuery({
    queryKey: [APP_CONSTANTS.QUERY_KEYS.MISSIONS],
    queryFn: fetchMissions,
    staleTime: Infinity, // Static data, never refetch
    gcTime: Infinity, // Keep in cache forever
  })
}

export function useUserStoresWithData() {
  const storesStore = useStoresStore()
  const { data: allStores } = useStoresQuery()

  const userStoresWithData = computed(() => {
    if (!allStores.value) {
      return []
    }

    return storesStore.userStores
      .map((us: { storeId: string; residents: string[] }) => {
        const store = allStores.value.find(s => s.id === us.storeId)
        return store
          ? {
              ...us,
              store,
            }
          : null
      })
      .filter((us): us is UserStore & { store: Store } => us !== null)
  })

  return {
    userStores: userStoresWithData,
    allStores: computed(() => allStores.value ?? []),
    isLoading: computed(() => !allStores.value),
  }
}

export function useUserMissionsWithData() {
  const missionsStore = useMissionsStore()
  const { data: allMissions } = useMissionsQuery()

  const userMissionsWithData = computed(() => {
    if (!allMissions.value) {
      return []
    }

    return missionsStore.userMissions
      .map((um: { missionId: string; status: 'pending' | 'completed'; addedAt: number }) => {
        const mission = allMissions.value.find((m: Mission) => m.id === um.missionId)
        return mission
          ? {
              ...um,
              mission,
            }
          : null
      })
      .filter((m): m is (typeof missionsStore.userMissions)[0] & { mission: Mission } => m !== null)
  })

  const pendingMissions = computed(() => {
    return userMissionsWithData.value.filter((um: { status: string }) => um.status === 'pending')
  })

  const completedMissions = computed(() => {
    return userMissionsWithData.value.filter((um: { status: string }) => um.status === 'completed')
  })

  return {
    allMissions: computed(() => allMissions.value ?? []),
    userMissions: userMissionsWithData,
    pendingMissions,
    completedMissions,
    isLoading: computed(() => !allMissions.value),
  }
}

export function useCompletableMissions() {
  const { userStores, allStores } = useUserStoresWithData()
  const { pendingMissions } = useUserMissionsWithData()

  const completableMissions = computed(() => {
    if (userStores.value.length === 0 || allStores.value.length === 0) {
      return []
    }

    const stores = userStores.value.map((us: { storeId: string; residents: string[] }) => ({
      storeId: us.storeId,
      residents: us.residents,
    }))

    return getCompletableMissions(
      pendingMissions.value.map((um: { mission: Mission }) => um.mission),
      stores,
      allStores.value
    )
  })

  function isMissionCompletable(missionId: string): boolean {
    const { data: allMissionsData } = useMissionsQuery()

    if (!allMissionsData.value || userStores.value.length === 0 || allStores.value.length === 0) {
      return false
    }

    const mission = allMissionsData.value.find((m: Mission) => m.id === missionId)
    if (!mission) {
      return false
    }

    const stores = userStores.value.map((us: { storeId: string; residents: string[] }) => ({
      storeId: us.storeId,
      residents: us.residents,
    }))

    return canCompleteMission(mission, stores, allStores.value)
  }

  return {
    completableMissions,
    isMissionCompletable,
  }
}
