<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6 flex items-start justify-between md:mb-8">
      <div class="flex-1">
        <h1 class="mb-2 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">🏢</span>
          <span
            class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400"
          >
            Dashboard
          </span>
        </h1>
        <p class="text-sm text-muted-foreground md:text-base">
          Welcome to your tower! Track progress and manage everything here
        </p>
      </div>
      <div class="hidden md:block">
        <TowerIllustration
          :width="120"
          :height="180"
          class="opacity-70 transition-opacity hover:opacity-100"
        />
      </div>
    </div>

    <!-- First Time Experience -->
    <div
      v-if="isFirstTime && hasNoData"
      class="mb-8 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-6"
    >
      <div class="text-center">
        <h2 class="mb-2 text-xl font-bold">Welcome to Tiny Tower Tracker!</h2>
        <p class="mb-4 text-sm text-muted-foreground">
          Get started by adding stores, residents, and missions to track your tower's progress.
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <Button variant="default" @click="$router.push('/stores')"> Add Your First Store </Button>
          <Button variant="outline" @click="$router.push('/residents')">
            Add Your First Resident
          </Button>
          <Button variant="outline" @click="$router.push('/missions')">Browse Missions</Button>
        </div>
      </div>
    </div>

    <div v-if="!hasNoData" class="mb-6">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <div class="p-4">
            <p class="text-xs font-medium text-muted-foreground">Missions completed</p>
            <div class="mt-1 flex items-baseline gap-2">
              <p class="text-2xl font-bold">{{ missionCompletionPct }}%</p>
              <p class="text-xs text-muted-foreground">({{ completedCount }}/{{ totalMissionsCount }})</p>
            </div>
            <div class="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                class="h-2 rounded-full bg-primary"
                :style="{ width: `${missionCompletionPct}%` }"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div class="p-4">
            <p class="text-xs font-medium text-muted-foreground">Residents in dream jobs</p>
            <div class="mt-1 flex items-baseline gap-2">
              <p class="text-2xl font-bold">{{ dreamJobPct }}%</p>
              <p class="text-xs text-muted-foreground">({{ residentsInDreamJobs }}/{{ totalResidentsCount }})</p>
            </div>
            <div class="mt-3 h-2 w-full rounded-full bg-muted">
              <div class="h-2 rounded-full bg-primary" :style="{ width: `${dreamJobPct}%` }" />
            </div>
          </div>
        </Card>

        <Card>
          <div class="p-4">
            <p class="text-xs font-medium text-muted-foreground">Stores built</p>
            <div class="mt-1 flex items-baseline gap-2">
              <p class="text-2xl font-bold">{{ storesBuiltPct }}%</p>
              <p class="text-xs text-muted-foreground">({{ storesBuiltCount }}/{{ totalStoresCount }})</p>
            </div>
            <div class="mt-3 h-2 w-full rounded-full bg-muted">
              <div class="h-2 rounded-full bg-primary" :style="{ width: `${storesBuiltPct}%` }" />
            </div>
          </div>
        </Card>

        <Card>
          <div class="p-4">
            <p class="text-xs font-medium text-muted-foreground">Store occupancy</p>
            <div class="mt-1 flex items-baseline gap-2">
              <p class="text-2xl font-bold">{{ storeOccupancyPct }}%</p>
              <p class="text-xs text-muted-foreground">({{ assignedResidentsCount }}/{{ totalCapacityCount }})</p>
            </div>
            <div class="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                class="h-2 rounded-full bg-primary"
                :style="{ width: `${storeOccupancyPct}%` }"
              />
            </div>
            <p v-if="readyMissionsCount > 0" class="mt-2 text-xs text-muted-foreground">
              {{ readyMissionsCount }} mission{{ readyMissionsCount === 1 ? '' : 's' }} ready to complete
            </p>
          </div>
        </Card>
      </div>
    </div>

    <PendingChanges />

    <div class="mt-8">
      <h2 class="mb-3 text-base font-semibold text-muted-foreground">Data</h2>
      <DataManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import DataManagement from '@/components/DataManagement.vue'
import PendingChanges from '@/components/PendingChanges.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { APP_CONSTANTS } from '@/constants'
import { useCompletableMissions, useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useResidentsStore } from '@/stores'
import { computed, onMounted, ref } from 'vue'

const { userStores, allStores } = useUserStoresWithData()
const { userMissions, pendingMissions, completedMissions } = useUserMissionsWithData()
const { completableMissions } = useCompletableMissions()
const residentsStore = useResidentsStore()

const hasNoData = computed(() => {
  return (
    userStores.value.length === 0 &&
    userMissions.value.length === 0 &&
    residentsStore.residents.length === 0
  )
})

const isFirstTime = ref(false)

const totalResidentsCount = computed(() => residentsStore.residents.length)
const residentsInDreamJobs = computed(() => {
  return residentsStore.residents.filter(r => residentsStore.getCurrentStore(r.id) === r.dreamJob).length
})
const dreamJobPct = computed(() => {
  const total = totalResidentsCount.value
  if (total === 0) return 0
  return Math.round((residentsInDreamJobs.value / total) * 100)
})

const totalMissionsCount = computed(() => pendingMissions.value.length + completedMissions.value.length)
const completedCount = computed(() => completedMissions.value.length)
const missionCompletionPct = computed(() => {
  const total = totalMissionsCount.value
  if (total === 0) return 0
  return Math.round((completedCount.value / total) * 100)
})

const storesBuiltCount = computed(() => userStores.value.length)
const totalStoresCount = computed(() => allStores.value.length)
const storesBuiltPct = computed(() => {
  const total = totalStoresCount.value
  if (total === 0) return 0
  return Math.round((storesBuiltCount.value / total) * 100)
})

const assignedResidentsCount = computed(() => userStores.value.reduce((sum, us) => sum + us.residents.length, 0))
const totalCapacityCount = computed(() => storesBuiltCount.value * APP_CONSTANTS.MAX_STORE_CAPACITY)
const storeOccupancyPct = computed(() => {
  const total = totalCapacityCount.value
  if (total === 0) return 0
  return Math.round((assignedResidentsCount.value / total) * 100)
})

const readyMissionsCount = computed(() => completableMissions.value.length)

onMounted(() => {
  // Check if this is likely first time (no data and no localStorage flag)
  if (hasNoData.value) {
    const hasVisited = localStorage.getItem(APP_CONSTANTS.FIRST_VISIT_KEY)
    if (!hasVisited) {
      localStorage.setItem(APP_CONSTANTS.FIRST_VISIT_KEY, 'true')
      isFirstTime.value = true
    }
  }
})
</script>
