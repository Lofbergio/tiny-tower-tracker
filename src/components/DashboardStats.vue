<template>
  <div v-if="hasAnyData" class="mb-6">
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <div class="p-4">
          <p class="text-xs font-medium text-muted-foreground">Missions completed</p>
          <div class="mt-1 flex items-baseline gap-2">
            <p class="text-2xl font-bold">{{ missionCompletionPct }}%</p>
            <p class="text-xs text-muted-foreground">
              ({{ completedCount }}/{{ totalMissionsCount }})
            </p>
          </div>
          <Progress :model-value="missionCompletionPct" class="mt-3" />
        </div>
      </Card>

      <Card>
        <div class="p-4">
          <p class="text-xs font-medium text-muted-foreground">Residents in dream jobs</p>
          <div class="mt-1 flex items-baseline gap-2">
            <p class="text-2xl font-bold">{{ dreamJobPct }}%</p>
            <p class="text-xs text-muted-foreground">
              ({{ residentsInDreamJobs }}/{{ totalResidentsCount }})
            </p>
          </div>
          <Progress :model-value="dreamJobPct" class="mt-3" />
        </div>
      </Card>

      <Card>
        <div class="p-4">
          <p class="text-xs font-medium text-muted-foreground">Stores built</p>
          <div class="mt-1 flex items-baseline gap-2">
            <p class="text-2xl font-bold">{{ storesBuiltPct }}%</p>
            <p class="text-xs text-muted-foreground">
              ({{ storesBuiltCount }}/{{ totalStoresCount }})
            </p>
          </div>
          <Progress :model-value="storesBuiltPct" class="mt-3" />
        </div>
      </Card>

      <Card>
        <div class="p-4">
          <p class="text-xs font-medium text-muted-foreground">Store occupancy</p>
          <div class="mt-1 flex items-baseline gap-2">
            <p class="text-2xl font-bold">{{ storeOccupancyPct }}%</p>
            <p class="text-xs text-muted-foreground">
              ({{ assignedResidentsCount }}/{{ totalCapacityCount }})
            </p>
          </div>
          <Progress :model-value="storeOccupancyPct" class="mt-3" />
          <p v-if="readyMissionsCount > 0" class="mt-2 text-xs text-muted-foreground">
            {{ readyMissionsCount }} mission{{ readyMissionsCount === 1 ? '' : 's' }} ready to
            complete
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
