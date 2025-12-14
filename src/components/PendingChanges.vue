<template>
  <div class="space-y-6">
    <!-- Mission Suggestions -->
    <div v-if="completableMissions.length > 0">
      <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span class="text-2xl">🎉</span>
        Missions Ready to Complete
      </h3>
      <div class="space-y-3">
        <Card
          v-for="mission in completableMissions"
          :key="mission.id"
          class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
        >
          <div class="p-4 sm:p-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex-1">
                <h4 class="mb-1 font-semibold">{{ mission.name }}</h4>
                <p class="mb-2 text-sm text-muted-foreground">{{ mission.description }}</p>
                <p class="text-sm">Reward: {{ mission.reward }} Bux</p>
              </div>
              <Button class="w-full sm:w-auto" @click="handleCompleteMission(mission.id)">
                Mark Done
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Resident Placement Suggestions -->
    <div v-if="residentPlacements.length > 0">
      <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span class="text-2xl">👷</span>
        Resident Placements Needed
      </h3>
      <div class="space-y-3">
        <Card
          v-for="placement in residentPlacements"
          :key="placement.resident.id"
          class="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div class="p-4 sm:p-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex-1">
                <h4 class="mb-1 font-semibold">{{ placement.resident.name }}</h4>
                <p class="text-sm text-muted-foreground">
                  Should be placed in <strong>{{ placement.storeName }}</strong> (dream job)
                </p>
                <p
                  v-if="placement.isFull"
                  class="mt-1 text-sm text-yellow-600 dark:text-yellow-400"
                >
                  ⚠️ Store is full (3/3). You may need to evict a resident.
                </p>
              </div>
              <Button
                class="w-full sm:w-auto"
                :disabled="placement.isFull"
                @click="handlePlaceResident(placement.resident.id, placement.storeId)"
              >
                Place Here
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Overcapacity Warnings -->
    <div v-if="overcapacityWarnings.length > 0">
      <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span class="text-2xl">⚠️</span>
        Overcapacity Warnings
      </h3>
      <div class="space-y-3">
        <Card
          v-for="warning in overcapacityWarnings"
          :key="warning.resident.id"
          class="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <div class="p-4 sm:p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="mb-1 font-semibold">{{ warning.resident.name }}</h4>
                <p class="text-sm text-muted-foreground">
                  Dream job is <strong>{{ warning.storeName }}</strong
                  >, but store is full (3/3)
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  Consider evicting a resident from this store
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- New Store Opportunities -->
    <div v-if="newStoreOpportunities.length > 0">
      <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span class="text-2xl">🏗️</span>
        New Store Opportunities
      </h3>
      <div class="space-y-3">
        <Card
          v-for="opportunity in newStoreOpportunities"
          :key="opportunity.storeId"
          class="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20"
        >
          <div class="p-4 sm:p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="mb-1 font-semibold">{{ opportunity.storeName }}</h4>
                <p class="text-sm text-muted-foreground">
                  {{ opportunity.residents.length }} resident(s) have this as their dream job:
                </p>
                <ul class="mt-1 space-y-1 text-sm">
                  <li v-for="resident in opportunity.residents" :key="resident.id">
                    • {{ resident.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-if="hasNoPendingChanges"
      title="All Set!"
      description="No pending changes. Everything is up to date and your tower is running smoothly!"
    />
  </div>
</template>

<script setup lang="ts">
import { useCompletableMissions, useUserStoresWithData } from '@/queries'
import { useMissionsStore, useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store } from '@/types'
import { useToast } from '@/utils/toast'
import { computed } from 'vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'
import EmptyState from './ui/EmptyState.vue'

const storesStore = useStoresStore()
const residentsStore = useResidentsStore()
const missionsStore = useMissionsStore()
const { userStores, allStores } = useUserStoresWithData()
const { completableMissions } = useCompletableMissions()
const toast = useToast()

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
    const store = allStores.value.find((s: Store) => s.id === resident.dreamJob)
    if (!store) {
      return
    }

    // Check if user has this store
    const userStore = userStores.value.find((us: { storeId: string }) => us.storeId === store.id)
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
    const store = allStores.value.find((s: Store) => s.id === resident.dreamJob)
    if (!store) {
      return
    }

    const userStore = userStores.value.find((us: { storeId: string }) => us.storeId === store.id)
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

  return opportunities
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
    const resident = residentsStore.residents.find((r: Resident) => r.id === residentId)
    const store = allStores.value.find(s => s.id === storeId)
    toast.success(`Placed ${resident?.name} in ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to place resident')
  }
}
</script>
