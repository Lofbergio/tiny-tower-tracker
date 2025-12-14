<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Missions</h1>
        <p class="text-sm text-muted-foreground">Track and complete your Tiny Tower missions</p>
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
      <Button @click="showAddDialog = true">Add Mission</Button>
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
            @complete="markMissionCompleted(userMission.missionId)"
            @reopen="markMissionPending(userMission.missionId)"
            @remove="removeMission(userMission.missionId)"
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
            @complete="markMissionCompleted(userMission.missionId)"
            @reopen="markMissionPending(userMission.missionId)"
            @remove="removeMission(userMission.missionId)"
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
            @complete="markMissionCompleted(userMission.missionId)"
            @reopen="markMissionPending(userMission.missionId)"
            @remove="removeMission(userMission.missionId)"
          />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import MissionCard from '@/components/MissionCard.vue'
import Button from '@/components/ui/Button.vue'
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
import { loadMissions, useMissions } from '@/composables/useMissions'
import { useStores } from '@/composables/useStores'
import { computed, onMounted, ref } from 'vue'

const { userStores, allStores } = useStores()
const {
  allMissions,
  userMissions,
  pendingMissions,
  completedMissions,
  addMission,
  markMissionCompleted,
  markMissionPending,
  removeMission,
  isMissionCompletable,
} = useMissions(userStores, allStores)

const activeTab = ref<'pending' | 'completed' | 'all'>('pending')
const showAddDialog = ref(false)
const selectedMissionId = ref('')

const availableMissions = computed(() => {
  const userMissionIds = new Set(userMissions.value.map(um => um.missionId))
  return allMissions.value.filter(m => !userMissionIds.has(m.id))
})

const availableMissionItems = computed(() => {
  return availableMissions.value.map(mission => ({ value: mission.id, label: mission.name }))
})

function handleAddMission() {
  if (selectedMissionId.value) {
    addMission(selectedMissionId.value)
    selectedMissionId.value = ''
    showAddDialog.value = false
  }
}

onMounted(async () => {
  await loadMissions()
})
</script>
