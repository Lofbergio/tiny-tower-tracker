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

    <DashboardStats />

    <PendingChanges />

    <div class="mt-8">
      <h2 class="mb-3 text-base font-semibold text-muted-foreground">Data</h2>
      <DataManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardStats from '@/components/DashboardStats.vue'
import DataManagement from '@/components/DataManagement.vue'
import PendingChanges from '@/components/PendingChanges.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import Button from '@/components/ui/Button.vue'
import { APP_CONSTANTS } from '@/constants'
import { useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useResidentsStore } from '@/stores'
import { computed, onMounted, ref } from 'vue'

const { userStores } = useUserStoresWithData()
const { userMissions } = useUserMissionsWithData()
const residentsStore = useResidentsStore()

const hasNoData = computed(() => {
  return (
    userStores.value.length === 0 &&
    userMissions.value.length === 0 &&
    residentsStore.residents.length === 0
  )
})

const isFirstTime = ref(false)

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
