<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6">
      <div class="mb-1 flex items-center gap-2">
        <h1 class="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">🎯</span>
          <span
            class="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent dark:from-green-400 dark:to-blue-400"
          >
            Missions
          </span>
        </h1>
      </div>
      <p class="text-muted-foreground text-sm md:text-base">Complete missions and earn Bux 💰✨</p>
    </div>

    <!-- Quick Stats Banner -->
    <div v-if="stats.totalPending > 0 || stats.completableAvailable > 0" class="mb-6">
      <Card
        class="border-primary/20 from-primary/5 via-primary/10 to-primary/5 overflow-hidden bg-gradient-to-br"
      >
        <div class="p-4">
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="rounded-lg bg-white/50 p-3 dark:bg-black/20">
              <p class="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                <span>📋</span>
                <span>Pending</span>
              </p>
              <p class="text-2xl font-bold">{{ stats.totalPending }}</p>
            </div>
            <div class="rounded-lg bg-green-50/80 p-3 dark:bg-green-950/20">
              <p class="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                <span>✅</span>
                <span>Ready</span>
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ stats.readyToComplete }}
              </p>
            </div>
            <div class="rounded-lg bg-yellow-50/80 p-3 dark:bg-yellow-950/20">
              <p class="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                <span>💰</span>
                <span>Potential Bux</span>
              </p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ stats.pendingBux.toLocaleString() }}
              </p>
            </div>
            <div class="rounded-lg bg-blue-50/80 p-3 dark:bg-blue-950/20">
              <p class="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                <span>🎁</span>
                <span>Available</span>
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ stats.completableAvailable }}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Pending Missions Tabs -->
    <Tabs v-model="activeTab" class="mb-6">
      <TabsList>
        <TabsTrigger value="pending"> Pending ({{ pendingMissions.length }}) </TabsTrigger>
        <TabsTrigger value="completed"> Completed ({{ completedMissions.length }}) </TabsTrigger>
        <TabsTrigger value="all"> All ({{ userMissions.length }}) </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <EmptyState
          v-if="pendingMissions.length === 0"
          title="🎉 No Pending Missions"
          description="All your missions are completed! Scroll down to see available missions you can add."
        >
          <Button variant="outline" @click="activeTab = 'all'">View All Missions</Button>
        </EmptyState>
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MissionCard
            v-for="userMission in pendingMissions"
            :key="userMission.missionId"
            :user-mission="userMission"
            :is-completable="isMissionCompletable(userMission.missionId)"
            @complete="handleCompleteMission(userMission.missionId)"
            @reopen="handleReopenMission(userMission.missionId)"
            @remove="handleRemoveMission(userMission.missionId)"
          />
        </div>
      </TabsContent>
      <TabsContent value="completed">
        <EmptyState
          v-if="completedMissions.length === 0"
          title="🎯 No Completed Missions"
          description="Complete missions to see them here. Keep building your tower!"
        />
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MissionCard
            v-for="userMission in completedMissions"
            :key="userMission.missionId"
            :user-mission="userMission"
            :is-completable="isMissionCompletable(userMission.missionId)"
            @complete="handleCompleteMission(userMission.missionId)"
            @reopen="handleReopenMission(userMission.missionId)"
            @remove="handleRemoveMission(userMission.missionId)"
          />
        </div>
      </TabsContent>
      <TabsContent value="all">
        <EmptyState
          v-if="userMissions.length === 0"
          title="🚀 No Missions Yet"
          description="Start tracking your Tiny Tower missions! Click the available missions below to get started."
        />
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MissionCard
            v-for="userMission in userMissions"
            :key="userMission.missionId"
            :user-mission="userMission"
            :is-completable="isMissionCompletable(userMission.missionId)"
            @complete="handleCompleteMission(userMission.missionId)"
            @reopen="handleReopenMission(userMission.missionId)"
            @remove="handleRemoveMission(userMission.missionId)"
          />
        </div>
      </TabsContent>
    </Tabs>

    <!-- Available Missions Section -->
    <div v-if="sortedCompletableMissions.length > 0" class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <span class="text-xl">🎯</span>
          <span>Ready to Start</span>
        </h2>
        <Badge variant="default" class="bg-green-600 dark:bg-green-700">
          {{ sortedCompletableMissions.length }}
        </Badge>
      </div>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="mission in sortedCompletableMissions"
          :key="mission.id"
          class="group relative cursor-pointer overflow-hidden border-l-4 border-green-500 transition-all hover:scale-[1.02] hover:shadow-lg dark:border-green-600"
          @click="handleAddMission(mission.id)"
        >
          <div
            class="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-green-500/10 transition-transform group-hover:scale-150"
          />
          <div class="relative flex flex-col space-y-1 p-3 md:p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-base font-semibold leading-tight md:text-lg">
                {{ mission.name }}
              </h3>
              <Badge variant="default" class="shrink-0 bg-green-600 text-xs dark:bg-green-700">
                💰 {{ mission.reward }}
              </Badge>
            </div>
            <p class="text-muted-foreground line-clamp-1 text-xs md:line-clamp-2">
              {{ mission.description }}
            </p>
          </div>
          <div class="p-3 pt-0 md:p-4 md:pt-0">
            <div class="space-y-1">
              <ul class="space-y-0.5 text-xs">
                <li
                  v-for="(req, index) in mission.requirements"
                  :key="index"
                  class="flex items-center gap-1.5"
                >
                  <span class="text-muted-foreground">{{ req.quantity }}x</span>
                  <span>{{ req.product }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <div v-if="sortedNonCompletableMissions.length > 0" class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-muted-foreground flex items-center gap-2 text-lg font-semibold">
          <span class="text-xl">🔒</span>
          <span>Need More Stores</span>
        </h2>
        <Badge variant="outline">{{ sortedNonCompletableMissions.length }}</Badge>
      </div>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="mission in sortedNonCompletableMissions"
          :key="mission.id"
          class="group relative cursor-pointer overflow-hidden border-l-4 border-gray-400 opacity-70 transition-all hover:opacity-90 dark:border-gray-600"
          @click="handleAddMission(mission.id)"
        >
          <div class="relative flex flex-col space-y-1 p-3 md:p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-base font-semibold leading-tight md:text-lg">
                {{ mission.name }}
              </h3>
              <Badge variant="outline" class="shrink-0 text-xs">💰 {{ mission.reward }}</Badge>
            </div>
            <p class="text-muted-foreground line-clamp-1 text-xs md:line-clamp-2">
              {{ mission.description }}
            </p>
          </div>
          <div class="p-3 pt-0 md:p-4 md:pt-0">
            <div class="space-y-2">
              <ul class="space-y-0.5 text-xs">
                <li
                  v-for="(req, index) in mission.requirements"
                  :key="index"
                  class="flex items-center gap-1.5"
                >
                  <span class="text-muted-foreground">{{ req.quantity }}x</span>
                  <span>{{ req.product }}</span>
                </li>
              </ul>
              <div
                v-if="getMissingStores(mission).length > 0"
                class="rounded bg-yellow-50 p-1.5 dark:bg-yellow-900/20 md:p-2"
              >
                <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  Need: {{ getMissingStores(mission).join(', ') }}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <EmptyState
      v-if="availableMissions.length === 0 && userMissions.length === 0"
      title="🏗️ No Available Missions"
      description="All missions have been added! Complete your pending missions or add more stores to unlock new ones."
    />

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      :open="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      :variant="confirmDialogData.variant"
      :confirm-text="confirmDialogData.confirmText"
      @update:open="showConfirmDialog = $event"
      @confirm="confirmDialogData.onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import MissionCard from '@/components/MissionCard.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Tabs from '@/components/ui/Tabs.vue'
import TabsContent from '@/components/ui/TabsContent.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import { useCompletableMissions, useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useMissionsStore } from '@/stores'
import type { Mission } from '@/types'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const missionsStore = useMissionsStore()
const { allMissions, userMissions, pendingMissions, completedMissions } = useUserMissionsWithData()
const { isMissionCompletable } = useCompletableMissions()
const { userStores, allStores } = useUserStoresWithData()
const toast = useToast()

const activeTab = ref<'pending' | 'completed' | 'all'>('pending')
const showConfirmDialog = ref(false)
const confirmDialogData = ref<{
  title: string
  message: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  confirmText: string
  onConfirm: () => void
}>({
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'Confirm',
  onConfirm: () => {},
})

const availableMissions = computed(() => {
  const userMissionIds = new Set(
    userMissions.value.map((um: { missionId: string }) => um.missionId)
  )
  return allMissions.value.filter(m => !userMissionIds.has(m.id))
})

const availableCompletableMissions = computed(() => {
  return availableMissions.value.filter(m => isMissionCompletable(m.id))
})

const availableNonCompletableMissions = computed(() => {
  return availableMissions.value.filter(m => !isMissionCompletable(m.id))
})

// Sorted missions by reward (highest first)
const sortedCompletableMissions = computed(() => {
  return [...availableCompletableMissions.value].sort((a, b) => b.reward - a.reward)
})

const sortedNonCompletableMissions = computed(() => {
  return [...availableNonCompletableMissions.value].sort((a, b) => b.reward - a.reward)
})

// Stats for banner
const stats = computed(() => {
  const totalPending = pendingMissions.value.length
  const readyToComplete = pendingMissions.value.filter((um: { missionId: string }) =>
    isMissionCompletable(um.missionId)
  ).length
  const pendingBux = pendingMissions.value.reduce(
    (sum: number, um: { mission: Mission }) => sum + um.mission.reward,
    0
  )
  const completableAvailable = availableCompletableMissions.value.length

  return {
    totalPending,
    readyToComplete,
    pendingBux,
    completableAvailable,
  }
})

// Get missing stores for a mission
function getMissingStores(mission: Mission): string[] {
  if (!allStores.value || userStores.value.length === 0) {
    return []
  }

  const userStoreIds = new Set(userStores.value.map((us: { storeId: string }) => us.storeId))
  const requiredStores = new Set(mission.requirements.map(req => req.store))

  const missing: string[] = []
  for (const storeName of requiredStores) {
    const store = allStores.value.find((s: { name: string }) => s.name === storeName)
    if (store && !userStoreIds.has(store.id)) {
      missing.push(storeName)
    }
  }

  return missing
}

function handleAddMission(missionId: string) {
  const success = missionsStore.addMission(missionId)
  if (success) {
    const mission = allMissions.value.find(m => m.id === missionId)
    toast.success(`✓ Added ${mission?.name} (${mission?.reward} Bux)`, 4000)
  } else {
    toast.error('Mission already added')
  }
}

function handleCompleteMission(missionId: string) {
  const mission = userMissions.value.find((um: { missionId: string }) => um.missionId === missionId)
  if (!mission) {
    return
  }

  const success = missionsStore.markMissionCompleted(missionId)
  if (success) {
    toast.success(`Completed: ${mission.mission.name}`)
  } else {
    toast.error('Failed to complete mission')
  }
}

function handleReopenMission(missionId: string) {
  const mission = userMissions.value.find((um: { missionId: string }) => um.missionId === missionId)
  if (!mission) {
    return
  }

  const success = missionsStore.markMissionPending(missionId)
  if (success) {
    toast.info(`Reopened: ${mission.mission.name}`)
  } else {
    toast.error('Failed to reopen mission')
  }
}

function handleRemoveMission(missionId: string) {
  const mission = userMissions.value.find((um: { missionId: string }) => um.missionId === missionId)
  if (!mission) {
    return
  }

  confirmDialogData.value = {
    title: 'Remove Mission',
    message: `Are you sure you want to remove "${mission.mission.name}"?`,
    variant: 'destructive',
    confirmText: 'Remove',
    onConfirm: () => {
      const success = missionsStore.removeMission(missionId)
      if (success) {
        toast.success(`Removed: ${mission.mission.name}`)
      } else {
        toast.error('Failed to remove mission')
      }
    },
  }
  showConfirmDialog.value = true
}
</script>
