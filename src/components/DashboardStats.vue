<template>
  <div v-if="hasAnyData" class="mb-6">
    <!-- Tower Level Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="level-badge text-sm">
          <span class="mr-1 text-xs opacity-75">LV</span>
          <span class="text-lg">{{ towerLevel }}</span>
        </div>
        <div class="flex-1">
          <p class="text-xs font-medium text-muted-foreground">Tower Progress</p>
          <div class="mt-1 flex items-center gap-2">
            <Progress
              :model-value="overallProgress"
              variant="default"
              size="sm"
              :animated="overallProgress > 0"
              class="flex-1"
            />
            <span class="text-[10px] font-bold tabular-nums text-muted-foreground">
              {{ overallProgress }}%
            </span>
          </div>
        </div>
      </div>
      <div v-if="totalCoinsEarned > 0" class="flex items-center gap-1.5">
        <span class="coin-icon coin-icon-md">💰</span>
        <span class="coin-display text-sm">{{ formatCoins(totalCoinsEarned) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      <!-- Missions Card -->
      <div class="stat-box-game group">
        <div class="mb-1.5 flex items-center justify-between sm:mb-2">
          <div class="flex items-center gap-1.5 sm:gap-2">
            <div
              class="icon-container-game flex h-7 w-7 items-center justify-center rounded-md text-sm sm:h-8 sm:w-8 sm:rounded-lg sm:text-lg"
            >
              🎯
            </div>
            <p
              class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
            >
              Missions
            </p>
          </div>
          <div v-if="readyMissionsCount > 0" class="flex items-center">
            <span
              class="motion-safe:animate-pulse-soft inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white"
            >
              {{ readyMissionsCount }}
            </span>
          </div>
        </div>
        <div class="flex items-baseline gap-1.5">
          <p
            class="stat-value text-lg font-black tabular-nums text-green-600 dark:text-green-400 sm:text-xl md:text-2xl"
          >
            {{ missionCompletionPct }}%
          </p>
          <p class="text-[9px] tabular-nums text-muted-foreground sm:text-[10px] md:text-xs">
            {{ completedCount }}/{{ totalMissionsCount }}
          </p>
        </div>
        <Progress
          :model-value="missionCompletionPct"
          variant="success"
          size="sm"
          :animated="missionCompletionPct > 0"
          class="mt-1.5 sm:mt-2"
        />
      </div>

      <!-- Dream Jobs Card -->
      <div class="stat-box-game group">
        <div class="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
          <div
            class="icon-container-game flex h-7 w-7 items-center justify-center rounded-md text-sm sm:h-8 sm:w-8 sm:rounded-lg sm:text-lg"
          >
            ✨
          </div>
          <p
            class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
          >
            Dream Jobs
          </p>
        </div>
        <div class="flex items-baseline gap-1.5">
          <p
            class="stat-value text-lg font-black tabular-nums text-blue-600 dark:text-blue-400 sm:text-xl md:text-2xl"
          >
            {{ dreamJobPct }}%
          </p>
          <p class="text-[9px] tabular-nums text-muted-foreground sm:text-[10px] md:text-xs">
            {{ residentsInDreamJobs }}/{{ totalResidentsCount }}
          </p>
        </div>
        <Progress
          :model-value="dreamJobPct"
          variant="info"
          size="sm"
          :animated="dreamJobPct > 0"
          class="mt-1.5 sm:mt-2"
        />
        <!-- Star rating for dream job completion -->
        <div class="mt-2 flex justify-center gap-0.5">
          <span
            v-for="star in 5"
            :key="star"
            :class="dreamJobPct >= star * 20 ? 'star-filled' : 'star-empty'"
            class="text-xs"
          >
            ★
          </span>
        </div>
      </div>

      <!-- Stores Card -->
      <div class="stat-box-game group">
        <div class="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
          <div
            class="icon-container-game flex h-7 w-7 items-center justify-center rounded-md text-sm sm:h-8 sm:w-8 sm:rounded-lg sm:text-lg"
          >
            🏪
          </div>
          <p
            class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
          >
            Stores
          </p>
        </div>
        <div class="flex items-baseline gap-1.5">
          <p
            class="stat-value text-lg font-black tabular-nums text-purple-600 dark:text-purple-400 sm:text-xl md:text-2xl"
          >
            {{ storesBuiltCount }}
          </p>
          <p class="text-[9px] tabular-nums text-muted-foreground sm:text-[10px] md:text-xs">
            of {{ totalStoresCount }}
          </p>
        </div>
        <Progress
          :model-value="storesBuiltPct"
          size="sm"
          :animated="storesBuiltPct > 0"
          class="mt-1.5 sm:mt-2"
        />
      </div>

      <!-- Staffing Card -->
      <div class="stat-box-game group">
        <div class="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
          <div
            class="icon-container-game flex h-7 w-7 items-center justify-center rounded-md text-sm sm:h-8 sm:w-8 sm:rounded-lg sm:text-lg"
          >
            👥
          </div>
          <p
            class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
          >
            Staffed
          </p>
        </div>
        <div class="flex items-baseline gap-1.5">
          <p
            class="stat-value text-lg font-black tabular-nums text-amber-600 dark:text-amber-400 sm:text-xl md:text-2xl"
          >
            {{ assignedResidentsCount }}
          </p>
          <p class="text-[9px] tabular-nums text-muted-foreground sm:text-[10px] md:text-xs">
            of {{ totalCapacityCount }}
          </p>
        </div>
        <Progress
          :model-value="storeOccupancyPct"
          variant="warning"
          size="sm"
          :animated="storeOccupancyPct > 0"
          class="mt-1.5 sm:mt-2"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// Calculate tower "level" based on overall progress
const towerLevel = computed(() => {
  const progress = overallProgress.value
  if (progress >= 90) return 10
  if (progress >= 80) return 9
  if (progress >= 70) return 8
  if (progress >= 60) return 7
  if (progress >= 50) return 6
  if (progress >= 40) return 5
  if (progress >= 30) return 4
  if (progress >= 20) return 3
  if (progress >= 10) return 2
  return 1
})

// Overall progress combines all stats
const overallProgress = computed(() => {
  const weights = [
    { value: missionCompletionPct.value, weight: 0.3 },
    { value: dreamJobPct.value, weight: 0.3 },
    { value: storesBuiltPct.value, weight: 0.2 },
    { value: storeOccupancyPct.value, weight: 0.2 },
  ]
  return Math.round(weights.reduce((sum, w) => sum + w.value * w.weight, 0))
})

// Total coins from completed missions
const totalCoinsEarned = computed(() => {
  return completedMissions.value.reduce((sum, m) => sum + (m.mission?.reward ?? 0), 0)
})

function formatCoins(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
  return amount.toLocaleString()
}

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
