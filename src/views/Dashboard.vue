<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <PageHeader icon="🏢">
      <template #title>
        <span
          class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400"
        >
          Dashboard
        </span>
      </template>
      <template #subtitle>Your tower at a glance</template>
      <template #aside>
        <TowerIllustration
          :width="120"
          :height="180"
          class="opacity-70 transition-opacity hover:opacity-100 motion-safe:animate-float-slow"
        />
      </template>
    </PageHeader>

    <!-- First Time Experience -->
    <div
      v-if="isFirstTime && hasNoData"
      class="mb-8 overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-6"
    >
      <div class="text-center">
        <div
          class="mb-3 inline-block rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-3 shadow-lg shadow-orange-500/25"
        >
          <span class="text-2xl">🏗️</span>
        </div>
        <h2
          class="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-black text-transparent dark:from-purple-400 dark:to-pink-400"
        >
          Welcome to Tiny Tower Tracker!
        </h2>
        <p class="mb-4 text-sm text-muted-foreground">
          Start building your tower by adding stores, residents, and missions.
        </p>
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button variant="default" class="w-full sm:w-auto" @click="$router.push('/stores')">
            <span class="mr-1.5">🏪</span>
            Add Your First Store
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="$router.push('/residents')">
            <span class="mr-1.5">👤</span>
            Add Residents
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="$router.push('/missions')">
            <span class="mr-1.5">🎯</span>
            Browse Missions
          </Button>
        </div>
      </div>
    </div>

    <DashboardStats />

    <PendingChanges />

    <!-- Settings Section (Collapsible) -->
    <div v-if="!hasNoData" class="mt-8">
      <button
        class="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted"
        @click="showSettings = !showSettings"
      >
        <span class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>⚙️</span>
          Settings & Data
        </span>
        <svg
          class="h-4 w-4 text-muted-foreground transition-transform"
          :class="{ 'rotate-180': showSettings }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div v-show="showSettings" class="mt-4 space-y-4">
        <DeviceSync />
        <DataManagement />
      </div>
    </div>

    <!-- Show settings expanded when no data -->
    <div v-else class="mt-8 space-y-4">
      <h2 class="text-base font-semibold text-muted-foreground">Settings & Data</h2>
      <DeviceSync />
      <DataManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardStats from '@/components/DashboardStats.vue'
import DataManagement from '@/components/DataManagement.vue'
import DeviceSync from '@/components/DeviceSync.vue'
import PageHeader from '@/components/PageHeader.vue'
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

const showSettings = ref(false)

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
