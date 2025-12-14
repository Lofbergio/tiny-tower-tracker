<template>
  <div class="space-y-6">
    <!-- Mission Suggestions -->
    <div v-if="completableMissions.length > 0">
      <h3 class="text-lg font-semibold mb-3">Missions Ready to Complete</h3>
      <div class="space-y-3">
        <Card
          v-for="mission in completableMissions"
          :key="mission.id"
          class="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        >
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ mission.name }}</h4>
                <p class="text-sm text-muted-foreground mb-2">{{ mission.description }}</p>
                <p class="text-sm">Reward: {{ mission.reward }} Bux</p>
              </div>
              <Button @click="handleCompleteMission(mission.id)">
                Mark Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Resident Placement Suggestions -->
    <div v-if="residentPlacements.length > 0">
      <h3 class="text-lg font-semibold mb-3">Resident Placements Needed</h3>
      <div class="space-y-3">
        <Card
          v-for="placement in residentPlacements"
          :key="placement.resident.id"
          class="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        >
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ placement.resident.name }}</h4>
                <p class="text-sm text-muted-foreground">
                  Should be placed in <strong>{{ placement.storeName }}</strong> (dream job)
                </p>
                <p v-if="placement.isFull" class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠️ Store is full (3/3). You may need to evict a resident.
                </p>
              </div>
              <Button
                :disabled="placement.isFull"
                @click="handlePlaceResident(placement.resident.id, placement.storeId)"
              >
                Place Here
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Overcapacity Warnings -->
    <div v-if="overcapacityWarnings.length > 0">
      <h3 class="text-lg font-semibold mb-3">Overcapacity Warnings</h3>
      <div class="space-y-3">
        <Card
          v-for="warning in overcapacityWarnings"
          :key="warning.resident.id"
          class="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
        >
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ warning.resident.name }}</h4>
                <p class="text-sm text-muted-foreground">
                  Dream job is <strong>{{ warning.storeName }}</strong>, but store is full (3/3)
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  Consider evicting a resident from this store
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- New Store Opportunities -->
    <div v-if="newStoreOpportunities.length > 0">
      <h3 class="text-lg font-semibold mb-3">New Store Opportunities</h3>
      <div class="space-y-3">
        <Card
          v-for="opportunity in newStoreOpportunities"
          :key="opportunity.storeId"
          class="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
        >
          <CardContent class="pt-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ opportunity.storeName }}</h4>
                <p class="text-sm text-muted-foreground">
                  {{ opportunity.residents.length }} resident(s) have this as their dream job:
                </p>
                <ul class="text-sm mt-1 space-y-1">
                  <li v-for="resident in opportunity.residents" :key="resident.id">
                    • {{ resident.name }}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="hasNoPendingChanges" class="text-center py-12">
      <p class="text-muted-foreground">No pending changes. Everything is up to date!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './ui/Card.vue'
import CardContent from './ui/CardContent.vue'
import Button from './ui/Button.vue'
import { useStores } from '@/composables/useStores'
import { useResidents } from '@/composables/useResidents'
import { useMissions } from '@/composables/useMissions'
import type { Resident, Store } from '@/types'

const storesComposable = useStores()
const { userStores, allStores, addResidentToStore, isStoreFull } = storesComposable
const { residents, getResidentsNotInDreamJob, getResidentsForStore } = useResidents()
const { completableMissions, markMissionCompleted } = useMissions(userStores, allStores)

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
  const residentsNotPlaced = getResidentsNotInDreamJob()

  residentsNotPlaced.forEach(resident => {
    const store = allStores.value.find((s: Store) => s.id === resident.dreamJob)
    if (!store) return

    // Check if user has this store
    const userStore = userStores.value.find(us => us.storeId === store.id)
    if (!userStore) return

    const isFull = isStoreFull(store.id)
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

  residents.value.forEach(resident => {
    const store = allStores.value.find((s: Store) => s.id === resident.dreamJob)
    if (!store) return

    const userStore = userStores.value.find(us => us.storeId === store.id)
    if (!userStore) return

    if (isStoreFull(store.id) && resident.currentStore !== store.id) {
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
  const builtStoreIds = new Set(userStores.value.map(us => us.storeId))

  allStores.value.forEach((store: Store) => {
    if (builtStoreIds.has(store.id)) return // Store already built

    const residentsForStore = getResidentsForStore(store.id)
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
  markMissionCompleted(missionId)
}

function handlePlaceResident(residentId: string, storeId: string) {
  addResidentToStore(storeId, residentId)
}
</script>

