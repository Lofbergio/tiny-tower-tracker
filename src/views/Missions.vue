<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <PageHeader icon="🎯">
      <template #title>Missions</template>
      <template #subtitle>Complete missions and earn Bux</template>
      <template #aside>
        <TowerIllustration
          :width="110"
          :height="165"
          class="opacity-70 transition-opacity hover:opacity-100 motion-safe:animate-float-slow"
        />
      </template>
    </PageHeader>

    <!-- Quick Stats Banner -->
    <div v-if="stats.totalPending > 0 || stats.completableAvailable > 0" class="mb-6">
      <Card
        class="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"
      >
        <div class="p-4">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="stat-box-game">
              <p
                class="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <span>📋</span>
                <span>Pending</span>
              </p>
              <p class="text-xl font-black tabular-nums md:text-2xl">{{ stats.totalPending }}</p>
            </div>
            <div class="stat-box-game bg-gradient-to-br from-green-500/10 to-emerald-500/5">
              <p
                class="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <span class="motion-safe:animate-sparkle">✨</span>
                <span>Ready</span>
              </p>
              <p
                class="text-xl font-black tabular-nums text-green-600 dark:text-green-400 md:text-2xl"
              >
                {{ stats.readyToComplete }}
              </p>
            </div>
            <div class="stat-box-game bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
              <p
                class="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <span>💰</span>
                <span>Potential</span>
              </p>
              <p class="coin-display text-xl font-black tabular-nums md:text-2xl">
                {{ stats.pendingBux.toLocaleString() }}
              </p>
            </div>
            <div class="stat-box-game bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
              <p
                class="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <span>🎁</span>
                <span>Available</span>
              </p>
              <p
                class="text-xl font-black tabular-nums text-blue-600 dark:text-blue-400 md:text-2xl"
              >
                {{ stats.completableAvailable }}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Unified Filter Tabs -->
    <div v-if="userMissions.length > 0" class="mb-6 space-y-3">
      <div class="flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-1.5">
        <button
          :class="[
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeTab === 'pending'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'pending'"
        >
          Pending
          <span class="ml-1 tabular-nums opacity-70">{{ pendingMissions.length }}</span>
        </button>
        <button
          :class="[
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeTab === 'completed'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'completed'"
        >
          Completed
          <span class="ml-1 tabular-nums opacity-70">{{ completedMissions.length }}</span>
        </button>
        <button
          :class="[
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeTab === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = 'all'"
        >
          All
          <span class="ml-1 tabular-nums opacity-70">{{ userMissions.length }}</span>
        </button>
      </div>
    </div>

    <!-- Search and Filters for Available Missions -->
    <div v-if="availableMissions.length > 5" class="mb-6 space-y-3">
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search available missions..."
            class="h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            @click="searchQuery = ''"
          >
            ✕
          </span>
        </div>
        <div class="sm:w-40">
          <Select v-model="rewardFilter" placeholder="All Rewards">
            <SelectItem value="all">All Rewards</SelectItem>
            <SelectItem value="high">High (6+ Bux)</SelectItem>
            <SelectItem value="medium">Medium (4-5 Bux)</SelectItem>
            <SelectItem value="low">Low (1-3 Bux)</SelectItem>
          </Select>
        </div>
      </div>
    </div>

    <!-- Filtered Missions Grid -->
    <div v-if="userMissions.length > 0" class="mb-8">
      <EmptyState
        v-if="filteredMissions.length === 0"
        :title="
          activeTab === 'pending'
            ? 'No Pending Missions'
            : activeTab === 'completed'
              ? 'No Completed Missions'
              : 'No Missions Yet'
        "
        :description="
          activeTab === 'pending'
            ? 'All your missions are completed! Scroll down to see available missions you can add.'
            : activeTab === 'completed'
              ? 'Complete missions to see them here. Keep building your tower!'
              : 'Start tracking your Tiny Tower missions!'
        "
        :icon="MissionsEmptyIcon"
      />
      <TransitionGroup
        v-else
        tag="div"
        name="list"
        class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <MissionCard
          v-for="userMission in filteredMissions"
          :key="userMission.missionId"
          :user-mission="userMission"
          :is-completable="isMissionCompletable(userMission.missionId)"
          @complete="handleCompleteMission(userMission.missionId)"
          @reopen="handleReopenMission(userMission.missionId)"
          @remove="handleRemoveMission(userMission.missionId)"
        />
      </TransitionGroup>
    </div>

    <!-- Available Missions Section -->
    <div v-if="sortedCompletableMissions.length > 0" class="mb-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Ready</h2>
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground"
            >{{ displayedCompletableMissions.length }} of
            {{ sortedCompletableMissions.length }}</span
          >
          <button
            v-if="sortedCompletableMissions.length > READY_MISSIONS_LIMIT"
            class="text-xs text-muted-foreground transition-colors hover:text-foreground"
            @click="showAllReadyMissions = !showAllReadyMissions"
          >
            {{ showAllReadyMissions ? 'Show Less' : 'Show All' }}
          </button>
        </div>
      </div>
      <TransitionGroup
        tag="div"
        name="list"
        class="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card
          v-for="mission in displayedCompletableMissions"
          :key="mission.id"
          class="pressable card-game group relative flex h-full cursor-pointer touch-manipulation flex-col overflow-hidden border-l-4 border-green-500 transition-all hover:shadow-xl hover:ring-1 hover:ring-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-green-600"
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
                {{ mission.reward }} Bux
              </Badge>
            </div>
            <p class="line-clamp-1 text-xs text-muted-foreground md:line-clamp-2">
              {{ mission.description }}
            </p>
          </div>
          <div class="flex flex-1 flex-col p-3 pt-0 md:p-4 md:pt-0">
            <div class="flex flex-1 flex-col">
              <ul class="min-h-[56px] space-y-0.5 text-xs">
                <li
                  v-for="(req, index) in mission.requirements"
                  :key="index"
                  class="grid grid-cols-[6ch_1ch_1fr] items-baseline gap-1.5"
                >
                  <span class="text-right tabular-nums text-muted-foreground">{{
                    req.quantity
                  }}</span>
                  <span class="text-muted-foreground" aria-hidden="true">×</span>
                  <span>{{ req.product }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </TransitionGroup>
    </div>

    <div v-if="filteredNonCompletableMissions.length > 0" class="mb-8">
      <button
        class="mb-4 flex w-full items-center justify-between rounded-lg bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        @click="showWaitingSection = !showWaitingSection"
      >
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-muted-foreground">Waiting</h2>
          <span class="text-sm text-muted-foreground"
            >({{ filteredNonCompletableMissions.length }})</span
          >
        </div>
        <svg
          class="h-5 w-5 text-muted-foreground transition-transform"
          :class="{ 'rotate-180': showWaitingSection }"
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
      <TransitionGroup
        v-show="showWaitingSection"
        tag="div"
        name="list"
        class="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card
          v-for="entry in filteredNonCompletableMissions"
          :key="entry.mission.id"
          class="pressable card-game group relative flex h-full cursor-pointer touch-manipulation flex-col overflow-hidden border-l-4 border-gray-400 opacity-80 transition-all hover:opacity-100 hover:shadow-xl hover:ring-1 hover:ring-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:opacity-95 dark:border-gray-600"
          @click="handleAddMission(entry.mission.id)"
        >
          <div class="relative flex flex-col space-y-1 p-3 md:p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-base font-semibold leading-tight md:text-lg">
                {{ entry.mission.name }}
              </h3>
              <Badge variant="outline" class="shrink-0 text-xs"
                >{{ entry.mission.reward }} Bux</Badge
              >
            </div>
            <p class="line-clamp-1 text-xs text-muted-foreground md:line-clamp-2">
              {{ entry.mission.description }}
            </p>
          </div>
          <div class="flex flex-1 flex-col p-3 pt-0 md:p-4 md:pt-0">
            <div class="flex flex-1 flex-col gap-2">
              <ul class="min-h-[56px] space-y-0.5 text-xs">
                <li
                  v-for="(req, index) in entry.mission.requirements"
                  :key="index"
                  class="grid grid-cols-[6ch_1ch_1fr] items-baseline gap-1.5"
                >
                  <span class="text-right tabular-nums text-muted-foreground">{{
                    req.quantity
                  }}</span>
                  <span class="text-muted-foreground" aria-hidden="true">×</span>
                  <span>{{ req.product }}</span>
                </li>
              </ul>
              <div
                v-if="entry.missingStores.length > 0"
                class="mt-auto rounded bg-yellow-50 p-1.5 dark:bg-yellow-900/20 md:p-2"
              >
                <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  Need: {{ entry.missingStores.join(', ') }}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </TransitionGroup>
    </div>

    <EmptyState
      v-if="availableMissions.length === 0 && userMissions.length === 0"
      title="No Missions Yet"
      description="Add missions to your tower and complete them for Bux!"
      :icon="MissionsEmptyIcon"
    >
      <Button @click="() => (activeTab = 'all')">View All Missions</Button>
    </EmptyState>

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
import PageHeader from '@/components/PageHeader.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import MissionsEmptyIcon from '@/components/illustrations/MissionsEmptyIcon.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Select from '@/components/ui/Select.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useCompletableMissions, useUserMissionsWithData, useUserStoresWithData } from '@/queries'
import { useMissionsStore } from '@/stores'
import type { Mission, UserMission } from '@/types'
import {
  createMissionMatcherContext,
  getMissingStoresWithContext,
  getMissionCoverageWithContext,
} from '@/utils/missionMatcher'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const missionsStore = useMissionsStore()
const { allMissions, userMissions, pendingMissions, completedMissions } = useUserMissionsWithData()
const { isMissionCompletable } = useCompletableMissions()
const { userStores, allStores } = useUserStoresWithData()
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()

const activeTab = ref<'pending' | 'completed' | 'all'>('pending')
const searchQuery = ref('')
const rewardFilter = ref<'all' | 'high' | 'medium' | 'low'>('all')
const showWaitingSection = ref(false)
const showAllReadyMissions = ref(false)

const READY_MISSIONS_LIMIT = 9

const filteredMissions = computed(() => {
  if (activeTab.value === 'pending') return pendingMissions.value
  if (activeTab.value === 'completed') return completedMissions.value
  return userMissions.value
})

const availableMissions = computed(() => {
  const userMissionIds = new Set(
    userMissions.value.map((um: UserMission & { mission: Mission }) => um.missionId)
  )
  let missions = allMissions.value.filter(m => !userMissionIds.has(m.id))

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    missions = missions.filter(
      m =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.requirements.some(r => r.product.toLowerCase().includes(query))
    )
  }

  // Apply reward filter
  if (rewardFilter.value !== 'all') {
    missions = missions.filter(m => {
      if (rewardFilter.value === 'high') return m.reward >= 6
      if (rewardFilter.value === 'medium') return m.reward >= 4 && m.reward <= 5
      if (rewardFilter.value === 'low') return m.reward >= 1 && m.reward <= 3
      return true
    })
  }

  return missions
})

const missionById = computed(() => {
  const map = new Map<string, Mission>()
  for (const mission of allMissions.value) {
    map.set(mission.id, mission)
  }
  return map
})

const userMissionById = computed(() => {
  const map = new Map<string, UserMission & { mission: Mission }>()
  for (const um of userMissions.value) {
    map.set(um.missionId, um)
  }
  return map
})

const availableCompletableMissions = computed(() => {
  return availableMissions.value.filter(m => isMissionCompletable(m.id))
})

const availableNonCompletableMissions = computed(() => {
  return availableMissions.value.filter(m => !isMissionCompletable(m.id))
})

const filteredNonCompletableMissions = computed(() => {
  return sortedNonCompletableMissions.value
})

// Sorted missions by reward (highest first)
const sortedCompletableMissions = computed(() => {
  return [...availableCompletableMissions.value].sort((a, b) => b.reward - a.reward)
})

const displayedCompletableMissions = computed(() => {
  if (
    showAllReadyMissions.value ||
    sortedCompletableMissions.value.length <= READY_MISSIONS_LIMIT
  ) {
    return sortedCompletableMissions.value
  }
  return sortedCompletableMissions.value.slice(0, READY_MISSIONS_LIMIT)
})

const sortedNonCompletableMissions = computed(() => {
  const stores = userStores.value.map(us => ({ storeId: us.storeId, residents: us.residents }))
  if (allStores.value.length === 0) {
    return [] as Array<{ mission: Mission; missingStores: string[] }>
  }

  const context = createMissionMatcherContext(stores, allStores.value)

  const meta = availableNonCompletableMissions.value.map(mission => {
    const coverage = getMissionCoverageWithContext(mission, context)
    const missingStores = getMissingStoresWithContext(mission, context)
    return { mission, coverage, missingStores }
  })

  meta.sort((a, b) => {
    if (b.coverage.ratio !== a.coverage.ratio) {
      return b.coverage.ratio - a.coverage.ratio
    }
    if (b.coverage.satisfied !== a.coverage.satisfied) {
      return b.coverage.satisfied - a.coverage.satisfied
    }
    if (b.mission.reward !== a.mission.reward) {
      return b.mission.reward - a.mission.reward
    }
    return a.mission.name.localeCompare(b.mission.name)
  })

  return meta.map(({ mission, missingStores }) => ({ mission, missingStores }))
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

// Missing stores are precomputed for non-completable missions (see sortedNonCompletableMissions)

function handleAddMission(missionId: string) {
  const success = missionsStore.addMission(missionId)
  if (success) {
    const mission = missionById.value.get(missionId)
    toast.success(`✓ Added ${mission?.name} (${mission?.reward} Bux)`)
  } else {
    toast.error('Mission already added')
  }
}

function handleCompleteMission(missionId: string) {
  const mission = userMissionById.value.get(missionId)
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
  const mission = userMissionById.value.get(missionId)
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
  const mission = userMissionById.value.get(missionId)
  if (!mission) {
    return
  }

  confirm({
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
  })
}
</script>
