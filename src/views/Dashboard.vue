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
      <template #subtitle
        >Welcome to your tower! Track progress and manage everything here</template
      >
      <template #aside>
        <TowerIllustration
          :width="120"
          :height="180"
          class="opacity-70 transition-opacity hover:opacity-100"
        />
      </template>
    </PageHeader>

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
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button variant="default" class="w-full sm:w-auto" @click="$router.push('/stores')">
            Add Your First Store
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="$router.push('/residents')">
            Add Your First Resident
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="$router.push('/missions')">
            Browse Missions
          </Button>
        </div>
      </div>
    </div>

    <DashboardStats />

    <Separator v-if="!hasNoData" class="my-8" />

    <PendingChanges />

    <Separator v-if="!hasNoData" class="my-8" />

    <div>
      <h2 class="mb-3 text-base font-semibold text-muted-foreground">Data Management</h2>
      <DataManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardStats from '@/components/DashboardStats.vue'
import DataManagement from '@/components/DataManagement.vue'
import PageHeader from '@/components/PageHeader.vue'
import PendingChanges from '@/components/PendingChanges.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import Button from '@/components/ui/Button.vue'
import Separator from '@/components/ui/Separator.vue'
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
