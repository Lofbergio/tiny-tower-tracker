import type { Mission, Store, UserStore } from '@/types'

export type MissionCoverage = {
  satisfied: number
  total: number
  ratio: number
}

export function canCompleteMission(
  mission: Mission,
  userStores: UserStore[],
  allStores: Store[]
): boolean {
  // Get store IDs that user has built
  const builtStoreIds = new Set(userStores.map(us => us.storeId))

  // Check if all mission requirements can be fulfilled
  return mission.requirements.every(req => {
    // Find the store that produces this product
    const store = allStores.find(s => s.name === req.store)
    if (!store) return false

    // Check if user has built this store
    if (!builtStoreIds.has(store.id)) return false

    // Check if the store produces this product
    return store.products.includes(req.product)
  })
}

export function getMissionCoverage(
  mission: Mission,
  userStores: UserStore[],
  allStores: Store[]
): MissionCoverage {
  const builtStoreIds = new Set(userStores.map(us => us.storeId))

  const total = mission.requirements.length
  if (total === 0) {
    return { satisfied: 0, total: 0, ratio: 0 }
  }

  let satisfied = 0
  for (const req of mission.requirements) {
    const store = allStores.find(s => s.name === req.store)
    if (!store) {
      continue
    }
    if (!builtStoreIds.has(store.id)) {
      continue
    }
    if (!store.products.includes(req.product)) {
      continue
    }
    satisfied += 1
  }

  return {
    satisfied,
    total,
    ratio: satisfied / total,
  }
}

export function getCompletableMissions(
  missions: Mission[],
  userStores: UserStore[],
  allStores: Store[]
): Mission[] {
  return missions.filter(mission => canCompleteMission(mission, userStores, allStores))
}

export function getMissionsForNewStore(
  newStoreId: string,
  missions: Mission[],
  userStores: UserStore[],
  allStores: Store[]
): Mission[] {
  const newStore = allStores.find(s => s.id === newStoreId)
  if (!newStore) return []

  // Get missions that require products from this store
  const relevantMissions = missions.filter(mission =>
    mission.requirements.some(req => req.store === newStore.name)
  )

  // Check which of these missions are now completable
  return relevantMissions.filter(mission => canCompleteMission(mission, userStores, allStores))
}
