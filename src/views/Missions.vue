<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6">
      <div class="mb-1 flex items-center gap-2">
        <h1 class="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">🎯</span>
          Missions
        </h1>
      </div>
      <p class="text-muted-foreground text-sm md:text-base">
        Track and complete your Tiny Tower missions
      </p>
    </div>

    <!-- Quick Stats Banner -->
    <div v-if="stats.totalPending > 0 || stats.completableAvailable > 0" class="mb-6">
      <Card class="bg-primary/5">
        <div class="p-4">
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p class="text-muted-foreground text-xs">Pending</p>
              <p class="text-2xl font-bold">{{ stats.totalPending }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">Ready to Complete</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ stats.readyToComplete }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">Potential Bux</p>
              <p class="text-2xl font-bold">{{ stats.pendingBux.toLocaleString() }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">Available to Add</p>
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
          title="No Pending Missions"
          description="All your missions are completed! Add new missions to track your progress."
        />
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
          title="No Completed Missions"
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
          title="No Missions Yet"
          description="Start tracking your Tiny Tower missions! Click 'Add Mission' to get started."
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
        <h2 class="text-lg font-semibold">Missions You Can Complete</h2>
        <Badge variant="default">{{ sortedCompletableMissions.length }}</Badge>
      </div>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="mission in sortedCompletableMissions"
          :key="mission.id"
          class="hover:bg-accent/50 cursor-pointer transition-colors"
          @click="handleAddMission(mission.id)"
        >
          <div class="flex flex-col space-y-1 p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-lg font-semibold leading-tight">
                {{ mission.name }}
              </h3>
              <Badge variant="default" class="shrink-0">{{ mission.reward }} Bux</Badge>
            </div>
            <p class="text-muted-foreground line-clamp-2 text-xs">{{ mission.description }}</p>
          </div>
          <div class="p-4 pt-0">
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
        <h2 class="text-muted-foreground text-lg font-semibold">Other Available Missions</h2>
        <Badge variant="outline">{{ sortedNonCompletableMissions.length }}</Badge>
      </div>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="mission in sortedNonCompletableMissions"
          :key="mission.id"
          class="hover:bg-accent/50 cursor-pointer opacity-60 transition-colors"
          @click="handleAddMission(mission.id)"
        >
          <div class="flex flex-col space-y-1 p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-lg font-semibold leading-tight">
                {{ mission.name }}
              </h3>
              <Badge variant="outline" class="shrink-0">{{ mission.reward }} Bux</Badge>
            </div>
            <p class="text-muted-foreground line-clamp-2 text-xs">{{ mission.description }}</p>
          </div>
          <div class="p-4 pt-0">
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
                class="rounded bg-yellow-50 p-2 dark:bg-yellow-900/20"
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
      title="No Available Missions"
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
    const missionName = allMissions.value.find(m => m.id === missionId)?.name
    toast.success(`Added mission: ${missionName}`)
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
