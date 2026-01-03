import type { Mission, Store, UserStore } from '@/types'

export type MissionCoverage = {
  satisfied: number
  total: number
  ratio: number
}

export type MissionMatcherContext = {
  builtStoreIds: Set<string>
  storeByName: Map<string, { id: string; products: Set<string> }>
}

export function createMissionMatcherContext(
  userStores: UserStore[],
  allStores: Store[]
): MissionMatcherContext {
  const builtStoreIds = new Set(userStores.map(us => us.storeId))
  const storeByName = new Map<string, { id: string; products: Set<string> }>()

  for (const store of allStores) {
    storeByName.set(store.name, {
      id: store.id,
      products: new Set(store.products),
    })
  }

  return { builtStoreIds, storeByName }
}

export function canCompleteMissionWithContext(
  mission: Mission,
  context: MissionMatcherContext
): boolean {
  return mission.requirements.every(req => {
    const store = context.storeByName.get(req.store)
    if (!store) return false
    if (!context.builtStoreIds.has(store.id)) return false
    return store.products.has(req.product)
  })
}

export function getMissionCoverageWithContext(
  mission: Mission,
  context: MissionMatcherContext
): MissionCoverage {
  const total = mission.requirements.length
  if (total === 0) {
    return { satisfied: 0, total: 0, ratio: 0 }
  }

  let satisfied = 0
  for (const req of mission.requirements) {
    const store = context.storeByName.get(req.store)
    if (!store) continue
    if (!context.builtStoreIds.has(store.id)) continue
    if (!store.products.has(req.product)) continue
    satisfied += 1
  }

  return {
    satisfied,
    total,
    ratio: satisfied / total,
  }
}

export function getMissingStoresWithContext(
  mission: Mission,
  context: MissionMatcherContext
): string[] {
  const requiredStoreNames = new Set(mission.requirements.map(r => r.store))
  const missing: string[] = []

  for (const storeName of requiredStoreNames) {
    const store = context.storeByName.get(storeName)
    if (!store) continue
    if (!context.builtStoreIds.has(store.id)) {
      missing.push(storeName)
    }
  }

  return missing
}

export function canCompleteMission(
  mission: Mission,
  userStores: UserStore[],
  allStores: Store[]
): boolean {
  return canCompleteMissionWithContext(mission, createMissionMatcherContext(userStores, allStores))
}

export function getMissionCoverage(
  mission: Mission,
  userStores: UserStore[],
  allStores: Store[]
): MissionCoverage {
  return getMissionCoverageWithContext(mission, createMissionMatcherContext(userStores, allStores))
}

export function getCompletableMissions(
  missions: Mission[],
  userStores: UserStore[],
  allStores: Store[]
): Mission[] {
  const context = createMissionMatcherContext(userStores, allStores)
  return missions.filter(mission => canCompleteMissionWithContext(mission, context))
}

export function getMissionsForNewStore(
  newStoreId: string,
  missions: Mission[],
  userStores: UserStore[],
  allStores: Store[]
): Mission[] {
  const storeById = new Map<string, Store>()
  for (const store of allStores) {
    storeById.set(store.id, store)
  }
  const newStore = storeById.get(newStoreId)
  if (!newStore) return []

  // Get missions that require products from this store
  const relevantMissions = missions.filter(mission =>
    mission.requirements.some(req => req.store === newStore.name)
  )

  // Check which of these missions are now completable
  const context = createMissionMatcherContext(userStores, allStores)
  return relevantMissions.filter(mission => canCompleteMissionWithContext(mission, context))
}
