import { computed, ref } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { canCompleteMission, getCompletableMissions } from '@/utils/missionMatcher'
import type { Mission, UserMission, UserStore, Store } from '@/types'

const allMissions = ref<Mission[]>([])

export async function loadMissions() {
  try {
    const response = await fetch('/db-mission.json')
    allMissions.value = await response.json()
  } catch (error) {
    console.error('Failed to load missions:', error)
  }
}

export function useMissions(
  userStores?: { value: (UserStore & { store: Store })[] },
  allStores?: { value: Store[] } | Store[]
) {
  const { data } = useLocalStorage()

  const storesArray = computed(() => {
    if (!allStores) return []
    return Array.isArray(allStores) ? allStores : allStores.value
  })

  const userMissions = computed(() => {
    return data.value.missions
      .map(um => {
        const mission = allMissions.value.find(m => m.id === um.missionId)
        return {
          ...um,
          mission,
        }
      })
      .filter(um => um.mission) as (UserMission & { mission: Mission })[]
  })

  const pendingMissions = computed(() => {
    return userMissions.value.filter(um => um.status === 'pending')
  })

  const completedMissions = computed(() => {
    return userMissions.value.filter(um => um.status === 'completed')
  })

  const completableMissions = computed(() => {
    if (!userStores || !storesArray.value.length) return []
    const stores = userStores.value.map(us => ({
      storeId: us.storeId,
      residents: us.residents,
    }))
    return getCompletableMissions(
      pendingMissions.value.map(um => um.mission),
      stores,
      storesArray.value
    )
  })

  function addMission(missionId: string) {
    if (data.value.missions.some(um => um.missionId === missionId)) {
      return false // Mission already added
    }
    data.value.missions.push({
      missionId,
      status: 'pending',
      addedAt: Date.now(),
    })
    return true
  }

  function markMissionCompleted(missionId: string) {
    const userMission = data.value.missions.find(um => um.missionId === missionId)
    if (userMission) {
      userMission.status = 'completed'
      return true
    }
    return false
  }

  function markMissionPending(missionId: string) {
    const userMission = data.value.missions.find(um => um.missionId === missionId)
    if (userMission) {
      userMission.status = 'pending'
      return true
    }
    return false
  }

  function removeMission(missionId: string) {
    const index = data.value.missions.findIndex(um => um.missionId === missionId)
    if (index !== -1) {
      data.value.missions.splice(index, 1)
      return true
    }
    return false
  }

  function isMissionCompletable(missionId: string) {
    const mission = allMissions.value.find(m => m.id === missionId)
    if (!mission || !userStores || !storesArray.value.length) return false

    const stores = userStores.value.map(us => ({
      storeId: us.storeId,
      residents: us.residents,
    }))
    return canCompleteMission(mission, stores, storesArray.value)
  }

  return {
    allMissions,
    userMissions,
    pendingMissions,
    completedMissions,
    completableMissions,
    addMission,
    markMissionCompleted,
    markMissionPending,
    removeMission,
    isMissionCompletable,
  }
}
