<template>
  <div v-if="hasAnyData" class="mb-6">
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card class="stat-card card-game overflow-hidden">
        <div class="p-3 md:p-4">
          <div class="mb-2 flex items-center gap-2">
            <div
              class="icon-container-game flex h-8 w-8 items-center justify-center rounded-lg text-lg"
            >
              🎯
            </div>
            <p class="text-xs font-medium text-muted-foreground">Missions</p>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="stat-value text-xl md:text-2xl">{{ missionCompletionPct }}%</p>
            <p class="text-[10px] tabular-nums text-muted-foreground md:text-xs">
              {{ completedCount }}/{{ totalMissionsCount }}
            </p>
          </div>
          <Progress
            :model-value="missionCompletionPct"
            variant="success"
            size="md"
            :animated="missionCompletionPct > 0"
            class="mt-2"
          />
        </div>
      </Card>

      <Card class="stat-card card-game overflow-hidden">
        <div class="p-3 md:p-4">
          <div class="mb-2 flex items-center gap-2">
            <div
              class="icon-container-game flex h-8 w-8 items-center justify-center rounded-lg text-lg"
            >
              ✨
            </div>
            <p class="text-xs font-medium text-muted-foreground">Dream Jobs</p>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="stat-value text-xl md:text-2xl">{{ dreamJobPct }}%</p>
            <p class="text-[10px] tabular-nums text-muted-foreground md:text-xs">
              {{ residentsInDreamJobs }}/{{ totalResidentsCount }}
            </p>
          </div>
          <Progress
            :model-value="dreamJobPct"
            variant="info"
            size="md"
            :animated="dreamJobPct > 0"
            class="mt-2"
          />
        </div>
      </Card>

      <Card class="stat-card card-game overflow-hidden">
        <div class="p-3 md:p-4">
          <div class="mb-2 flex items-center gap-2">
            <div
              class="icon-container-game flex h-8 w-8 items-center justify-center rounded-lg text-lg"
            >
              🏪
            </div>
            <p class="text-xs font-medium text-muted-foreground">Stores Built</p>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="stat-value text-xl md:text-2xl">{{ storesBuiltPct }}%</p>
            <p class="text-[10px] tabular-nums text-muted-foreground md:text-xs">
              {{ storesBuiltCount }}/{{ totalStoresCount }}
            </p>
          </div>
          <Progress
            :model-value="storesBuiltPct"
            size="md"
            :animated="storesBuiltPct > 0"
            class="mt-2"
          />
        </div>
      </Card>

      <Card class="stat-card card-game overflow-hidden">
        <div class="p-3 md:p-4">
          <div class="mb-2 flex items-center gap-2">
            <div
              class="icon-container-game flex h-8 w-8 items-center justify-center rounded-lg text-lg"
            >
              👥
            </div>
            <p class="text-xs font-medium text-muted-foreground">Occupancy</p>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="stat-value text-xl md:text-2xl">{{ storeOccupancyPct }}%</p>
            <p class="text-[10px] tabular-nums text-muted-foreground md:text-xs">
              {{ assignedResidentsCount }}/{{ totalCapacityCount }}
            </p>
          </div>
          <Progress
            :model-value="storeOccupancyPct"
            variant="warning"
            size="md"
            :animated="storeOccupancyPct > 0"
            class="mt-2"
          />
          <p
            v-if="readyMissionsCount > 0"
            class="mt-2 flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 md:text-xs"
          >
            <span class="motion-safe:animate-sparkle inline-block">✓</span>
            {{ readyMissionsCount }} ready
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import Progress from '@/components/ui/Progress.vue'
import { APP_CONSTANTS } from '@/constants'
import { useCompletableMissions, useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useResidentsStore } from '@/stores'
import { computed } from 'vue'

const { userStores, allStores } = useUserStoresWithData()
const { pendingMissions, completedMissions } = useUserMissionsWithData()
const { completableMissions } = useCompletableMissions()
const residentsStore = useResidentsStore()

const hasAnyData = computed(() => {
  return (
    userStores.value.length > 0 ||
    pendingMissions.value.length > 0 ||
    completedMissions.value.length > 0 ||
    residentsStore.residents.length > 0
  )
})

const totalResidentsCount = computed(() => residentsStore.residents.length)
const residentsInDreamJobs = computed(() => {
  return residentsStore.residents.filter(r => residentsStore.getCurrentStore(r.id) === r.dreamJob)
    .length
})
const dreamJobPct = computed(() => {
  const total = totalResidentsCount.value
  if (total === 0) return 0
  return Math.round((residentsInDreamJobs.value / total) * 100)
})

const totalMissionsCount = computed(
  () => pendingMissions.value.length + completedMissions.value.length
)
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

const assignedResidentsCount = computed(() =>
  userStores.value.reduce((sum, us) => sum + us.residents.length, 0)
)
const totalCapacityCount = computed(() => storesBuiltCount.value * APP_CONSTANTS.MAX_STORE_CAPACITY)
const storeOccupancyPct = computed(() => {
  const total = totalCapacityCount.value
  if (total === 0) return 0
  return Math.round((assignedResidentsCount.value / total) * 100)
})

const readyMissionsCount = computed(() => completableMissions.value.length)
</script>
