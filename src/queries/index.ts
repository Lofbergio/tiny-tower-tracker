import { APP_CONSTANTS } from '@/constants'
import { useMissionsStore, useStoresStore } from '@/stores'
import type { Mission, Store, UserMission, UserStore } from '@/types'
import { canCompleteMissionWithContext, createMissionMatcherContext } from '@/utils/missionMatcher'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

async function fetchStores(): Promise<Store[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(APP_CONSTANTS.STORES_DATA_URL, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error('Failed to load stores')
    }
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchMissions(): Promise<Mission[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(APP_CONSTANTS.MISSIONS_DATA_URL, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error('Failed to load missions')
    }
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
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

  const storesById = computed(() => {
    const map = new Map<string, Store>()
    for (const store of allStores.value ?? []) {
      map.set(store.id, store)
    }
    return map
  })

  const userStoresWithData = computed(() => {
    if (!allStores.value) {
      return []
    }

    return storesStore.userStores
      .map((us: UserStore) => {
        const store = storesById.value.get(us.storeId)
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

  function placeholderMission(id: string): Mission {
    return {
      id,
      name: `Unknown mission (${id})`,
      description: 'Mission data is unavailable right now.',
      requirements: [],
      reward: 0,
    }
  }

  const missionsById = computed(() => {
    const map = new Map<string, Mission>()
    for (const mission of allMissions.value ?? []) {
      map.set(mission.id, mission)
    }
    return map
  })

  const userMissionsWithData = computed(() => {
    return missionsStore.userMissions.map((um: UserMission) => {
      const mission = missionsById.value.get(um.missionId) ?? placeholderMission(um.missionId)
      return {
        ...um,
        mission,
      }
    })
  })

  const pendingMissions = computed(() => {
    return userMissionsWithData.value.filter(
      (um: UserMission & { mission: Mission }) => um.status === 'pending'
    )
  })

  const completedMissions = computed(() => {
    return userMissionsWithData.value.filter(
      (um: UserMission & { mission: Mission }) => um.status === 'completed'
    )
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
  const { data: allMissionsData } = useMissionsQuery()

  const compactUserStores = computed(() => {
    return userStores.value.map((us: UserStore & { store: Store }) => ({
      storeId: us.storeId,
      residents: us.residents,
    }))
  })

  const matcherContext = computed(() => {
    if (compactUserStores.value.length === 0 || allStores.value.length === 0) {
      return null
    }
    return createMissionMatcherContext(compactUserStores.value, allStores.value)
  })

  const completableByMissionId = computed(() => {
    const context = matcherContext.value
    if (!context || !allMissionsData.value) {
      return new Map<string, boolean>()
    }

    const map = new Map<string, boolean>()
    for (const mission of allMissionsData.value) {
      map.set(mission.id, canCompleteMissionWithContext(mission, context))
    }
    return map
  })

  const completableMissions = computed(() => {
    if (userStores.value.length === 0 || allStores.value.length === 0) {
      return []
    }

    const pending = pendingMissions.value
      .map((um: UserMission & { mission: Mission }) => um.mission)
      .filter(m => completableByMissionId.value.get(m.id) === true)

    return pending
  })

  function isMissionCompletable(missionId: string): boolean {
    return completableByMissionId.value.get(missionId) === true
  }

  return {
    completableMissions,
    isMissionCompletable,
  }
}
