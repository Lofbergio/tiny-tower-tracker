<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex-1">
        <h1 class="mb-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">🎯</span>
          Missions
        </h1>
        <p class="text-muted-foreground text-sm md:text-base">
          Track and complete your Tiny Tower missions
        </p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogContent>
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle>Add Mission</DialogTitle>
          </div>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Select Mission</Label>
              <SearchableSelect
                v-model="selectedMissionId"
                :items="availableMissionItems"
                placeholder="Choose a mission..."
                search-placeholder="Search missions…"
              />
            </div>
          </div>
          <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
            <Button :disabled="!selectedMissionId" @click="handleAddMission">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button class="w-full sm:w-auto" @click="showAddDialog = true">
        <span class="sm:hidden">Add</span>
        <span class="hidden sm:inline">Add Mission</span>
      </Button>
    </div>

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
        >
          <Button @click="showAddDialog = true">Add Your First Mission</Button>
        </EmptyState>
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
import Button from '@/components/ui/Button.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import Tabs from '@/components/ui/Tabs.vue'
import TabsContent from '@/components/ui/TabsContent.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import { useCompletableMissions, useUserMissionsWithData } from '@/queries'
import { useMissionsStore } from '@/stores'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const missionsStore = useMissionsStore()
const { allMissions, userMissions, pendingMissions, completedMissions } = useUserMissionsWithData()
const { isMissionCompletable } = useCompletableMissions()
const toast = useToast()

const activeTab = ref<'pending' | 'completed' | 'all'>('pending')
const showAddDialog = ref(false)
const selectedMissionId = ref('')
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

const availableMissionItems = computed(() => {
  return availableMissions.value.map(mission => ({ value: mission.id, label: mission.name }))
})

function handleAddMission() {
  if (selectedMissionId.value) {
    const success = missionsStore.addMission(selectedMissionId.value)
    if (success) {
      const missionName = allMissions.value.find(m => m.id === selectedMissionId.value)?.name
      toast.success(`Added mission: ${missionName}`)
      selectedMissionId.value = ''
      showAddDialog.value = false
    } else {
      toast.error('Mission already added')
    }
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
