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
        <p class="text-muted-foreground text-sm md:text-base">
          Welcome to your tower! 🎉 Track progress and manage everything here
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
      class="border-primary/50 bg-primary/5 mb-8 rounded-lg border-2 border-dashed p-6"
    >
      <div class="text-center">
        <h2 class="mb-2 text-xl font-bold">Welcome to Tiny Tower Tracker! 🎉</h2>
        <p class="text-muted-foreground mb-4 text-sm">
          Get started by adding stores, residents, and missions to track your tower's progress.
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <Button variant="default" @click="$router.push('/stores')">
            🏪 Add Your First Store
          </Button>
          <Button variant="outline" @click="$router.push('/residents')">
            👥 Add Your First Resident
          </Button>
          <Button variant="outline" @click="$router.push('/missions')"> 🎯 Browse Missions </Button>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <DataManagement />
    </div>

    <PendingChanges />
  </div>
</template>

<script setup lang="ts">
import DataManagement from '@/components/DataManagement.vue'
import PendingChanges from '@/components/PendingChanges.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import Button from '@/components/ui/Button.vue'
import { useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useResidentsStore } from '@/stores'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
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

const isFirstTime = computed(() => {
  // Check if this is likely first time (no data and no localStorage flag)
  if (!hasNoData.value) return false
  const hasVisited = localStorage.getItem('tiny-tower-has-visited')
  if (!hasVisited) {
    localStorage.setItem('tiny-tower-has-visited', 'true')
    return true
  }
  return false
})
</script>
