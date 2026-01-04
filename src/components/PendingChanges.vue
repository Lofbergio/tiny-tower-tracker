<template>
  <div class="space-y-4">
    <!-- Mission Suggestions -->
    <div v-if="completableMissions.length > 0">
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span>🎉</span>
        Missions Ready ({{ completableMissions.length }})
      </h3>
      <div class="space-y-2">
        <Card
          v-for="mission in completableMissions"
          :key="mission.id"
          class="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
        >
          <div class="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div class="min-w-0 flex-1">
              <h4 class="truncate text-sm font-medium">{{ mission.name }}</h4>
              <p class="text-xs text-muted-foreground">{{ mission.reward }} Bux reward</p>
            </div>
            <Button size="sm" @click="handleCompleteMission(mission.id)"> Done </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Resident Placement Suggestions -->
    <div v-if="residentPlacements.length > 0">
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span>👷</span>
        Place Residents ({{ residentPlacements.length }})
      </h3>
      <div class="space-y-2">
        <Card
          v-for="placement in residentPlacements"
          :key="placement.resident.id"
          class="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div class="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div class="min-w-0 flex-1">
              <h4 class="truncate text-sm font-medium">{{ placement.resident.name }}</h4>
              <p class="flex items-center gap-1 text-xs text-muted-foreground">
                <span>→</span>
                <StoreIcon
                  v-if="storeById.get(placement.storeId)"
                  :category="storeById.get(placement.storeId)?.category ?? ''"
                  :size="12"
                />
                <span class="truncate">{{ placement.storeName }}</span>
                <span v-if="placement.isFull" class="shrink-0 text-yellow-600 dark:text-yellow-400"
                  >⚠️ Full</span
                >
              </p>
            </div>
            <div class="flex shrink-0 gap-1.5">
              <Button
                size="sm"
                :disabled="placement.isFull"
                @click="handlePlaceResident(placement.resident.id, placement.storeId)"
              >
                Place
              </Button>
              <Button variant="ghost" size="sm" @click="goToStore(placement.storeId)">
                View
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Overcapacity Warnings -->
    <div v-if="overcapacityWarnings.length > 0">
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span>⚠️</span>
        Full Stores ({{ overcapacityWarnings.length }})
      </h3>
      <div class="space-y-2">
        <Card
          v-for="warning in overcapacityWarnings"
          :key="warning.resident.id"
          class="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <div class="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div class="min-w-0 flex-1">
              <h4 class="truncate text-sm font-medium">{{ warning.resident.name }}</h4>
              <p class="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Dream job:</span>
                <StoreIcon
                  v-if="storeById.get(warning.storeId)"
                  :category="storeById.get(warning.storeId)?.category ?? ''"
                  :size="12"
                />
                <span class="truncate">{{ warning.storeName }}</span>
                <span class="shrink-0">(3/3)</span>
              </p>
            </div>
            <Button variant="outline" size="sm" @click="goToStore(warning.storeId)"> View </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- New Store Opportunities -->
    <div v-if="newStoreOpportunities.length > 0">
      <div class="mb-2 flex items-center justify-between gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span>🏗️</span>
          Build Stores
          <span v-if="!showAllStores && hasMoreStores" class="text-xs font-normal opacity-75"
            >({{ topStoreOpportunities.length }} of {{ newStoreOpportunities.length }})</span
          >
          <span v-else class="text-xs font-normal opacity-75"
            >({{ newStoreOpportunities.length }})</span
          >
        </h3>
        <button
          v-if="hasMoreStores"
          class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="showAllStores = !showAllStores"
        >
          {{ showAllStores ? 'Show Less' : 'Show All' }}
        </button>
      </div>
      <div class="space-y-2">
        <Card
          v-for="opportunity in displayedStoreOpportunities"
          :key="opportunity.storeId"
          :class="
            opportunity.residents.length > 3
              ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20'
              : 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20'
          "
        >
          <div class="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div class="min-w-0 flex-1">
              <h4 class="flex items-center gap-1.5 text-sm font-medium">
                <StoreIcon
                  v-if="storeById.get(opportunity.storeId)"
                  :category="storeById.get(opportunity.storeId)?.category ?? ''"
                  :size="14"
                />
                <span class="truncate">{{ opportunity.storeName }}</span>
                <span
                  v-if="opportunity.residents.length > 3"
                  class="shrink-0 text-orange-600 dark:text-orange-400"
                  title="Store capacity is 3 - you'll need to evict residents"
                  >⚠️</span
                >
              </h4>
              <p class="text-xs text-muted-foreground">
                {{ opportunity.residents.length }} resident{{
                  opportunity.residents.length !== 1 ? 's' : ''
                }}
                waiting
                <span
                  v-if="opportunity.residents.length > 3"
                  class="font-medium text-orange-600 dark:text-orange-400"
                >
                  ({{ opportunity.residents.length - 3 }} will need eviction)
                </span>
              </p>
            </div>
            <Button size="sm" @click="handleAddStore(opportunity.storeId)"> Add </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Empty State - more subtle -->
    <div v-if="hasNoPendingChanges" class="rounded-lg bg-muted/30 py-6 text-center">
      <p class="text-sm text-muted-foreground">✓ All caught up! No actions needed.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompletableMissions, useUserStoresWithData } from '@/queries'
import { useMissionsStore, useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store } from '@/types'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StoreIcon from './StoreIcon.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

const storesStore = useStoresStore()
const residentsStore = useResidentsStore()
const missionsStore = useMissionsStore()
const { userStores, allStores } = useUserStoresWithData()
const { completableMissions } = useCompletableMissions()
const toast = useToast()
const router = useRouter()

const showAllStores = ref(false)
const MAX_DISPLAYED_STORES = 5

const storeById = computed(() => {
  const map = new Map<string, Store>()
  for (const store of allStores.value) {
    map.set(store.id, store)
  }
  return map
})

const userStoreById = computed(() => {
  const map = new Map<string, { storeId: string; residents: string[] }>()
  for (const us of userStores.value) {
    map.set(us.storeId, us)
  }
  return map
})

const residentById = computed(() => {
  const map = new Map<string, Resident>()
  for (const r of residentsStore.residents) {
    map.set(r.id, r)
  }
  return map
})

interface ResidentPlacement {
  resident: Resident
  storeId: string
  storeName: string
  isFull: boolean
}

interface OvercapacityWarning {
  resident: Resident
  storeId: string
  storeName: string
}

interface NewStoreOpportunity {
  storeId: string
  storeName: string
  residents: Resident[]
}

const residentPlacements = computed<ResidentPlacement[]>(() => {
  const placements: ResidentPlacement[] = []
  const residentsNotPlaced = residentsStore.getResidentsNotInDreamJob()

  residentsNotPlaced.forEach((resident: Resident) => {
    const store = storeById.value.get(resident.dreamJob)
    if (!store) {
      return
    }

    // Check if user has this store
    const userStore = userStoreById.value.get(store.id)
    if (!userStore) {
      return
    }

    const isFull = storesStore.isStoreFull(store.id)
    if (!isFull) {
      placements.push({
        resident,
        storeId: store.id,
        storeName: store.name,
        isFull: false,
      })
    }
  })

  return placements
})

const overcapacityWarnings = computed<OvercapacityWarning[]>(() => {
  const warnings: OvercapacityWarning[] = []

  residentsStore.residents.forEach((resident: Resident) => {
    const store = storeById.value.get(resident.dreamJob)
    if (!store) {
      return
    }

    const userStore = userStoreById.value.get(store.id)
    if (!userStore) {
      return
    }

    const currentStore = residentsStore.getCurrentStore(resident.id)
    if (storesStore.isStoreFull(store.id) && currentStore !== store.id) {
      warnings.push({
        resident,
        storeId: store.id,
        storeName: store.name,
      })
    }
  })

  return warnings
})

const newStoreOpportunities = computed<NewStoreOpportunity[]>(() => {
  const opportunities: NewStoreOpportunity[] = []
  const builtStoreIds = new Set(storesStore.userStores.map((us: { storeId: string }) => us.storeId))

  allStores.value.forEach((store: Store) => {
    if (builtStoreIds.has(store.id)) {
      return // Store already built
    }

    const residentsForStore = residentsStore.getResidentsForStore(store.id)
    if (residentsForStore.length > 0) {
      opportunities.push({
        storeId: store.id,
        storeName: store.name,
        residents: residentsForStore,
      })
    }
  })

  // Sort by number of waiting residents (descending)
  return opportunities.sort((a, b) => b.residents.length - a.residents.length)
})

const topStoreOpportunities = computed(() => {
  return newStoreOpportunities.value.slice(0, MAX_DISPLAYED_STORES)
})

const hasMoreStores = computed(() => {
  return newStoreOpportunities.value.length > MAX_DISPLAYED_STORES
})

const displayedStoreOpportunities = computed(() => {
  return showAllStores.value ? newStoreOpportunities.value : topStoreOpportunities.value
})

const hasNoPendingChanges = computed(() => {
  return (
    completableMissions.value.length === 0 &&
    residentPlacements.value.length === 0 &&
    overcapacityWarnings.value.length === 0 &&
    newStoreOpportunities.value.length === 0
  )
})

function handleCompleteMission(missionId: string) {
  const success = missionsStore.markMissionCompleted(missionId)
  if (success) {
    toast.success('Mission completed!')
  } else {
    toast.error('Failed to complete mission')
  }
}

function handlePlaceResident(residentId: string, storeId: string) {
  const result = storesStore.addResidentToStore(storeId, residentId)
  if (result.success) {
    const resident = residentById.value.get(residentId)
    const store = storeById.value.get(storeId)
    toast.success(`Placed ${resident?.name} in ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to place resident')
  }
}

function goToStore(storeId: string) {
  router.push({
    path: '/stores',
    query: {
      focusStoreId: storeId,
    },
  })
}

function handleAddStore(storeId: string) {
  const store = storeById.value.get(storeId)
  const added = storesStore.addStore(storeId)
  if (added) {
    toast.success(`Added ${store?.name ?? 'store'}`)
    goToStore(storeId)
    return
  }
  toast.info('Store already added')
}
</script>
