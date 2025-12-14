<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Missions</h1>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogHeader>
          <DialogTitle>Add Mission</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Select Mission</label>
              <Select v-model="selectedMissionId">
                <option value="">Choose a mission...</option>
                <option
                  v-for="mission in availableMissions"
                  :key="mission.id"
                  :value="mission.id"
                >
                  {{ mission.name }}
                </option>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
          <Button @click="handleAddMission" :disabled="!selectedMissionId">Add</Button>
        </DialogFooter>
      </Dialog>
      <Button @click="showAddDialog = true">Add Mission</Button>
    </div>

    <Tabs v-model="activeTab" class="mb-6">
      <TabsList>
        <TabsTrigger :is-active="activeTab === 'pending'" @click="activeTab = 'pending'">
          Pending ({{ pendingMissions.length }})
        </TabsTrigger>
        <TabsTrigger :is-active="activeTab === 'completed'" @click="activeTab = 'completed'">
          Completed ({{ completedMissions.length }})
        </TabsTrigger>
        <TabsTrigger :is-active="activeTab === 'all'" @click="activeTab = 'all'">
          All ({{ userMissions.length }})
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div v-if="displayedMissions.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">No missions found.</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MissionCard
        v-for="userMission in displayedMissions"
        :key="userMission.missionId"
        :user-mission="userMission"
        :is-completable="isMissionCompletable(userMission.missionId)"
        @complete="markMissionCompleted(userMission.missionId)"
        @reopen="markMissionPending(userMission.missionId)"
        @remove="removeMission(userMission.missionId)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Select from '@/components/ui/Select.vue'
import Tabs from '@/components/ui/Tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import MissionCard from '@/components/MissionCard.vue'
import { useMissions, loadMissions } from '@/composables/useMissions'
import { useStores } from '@/composables/useStores'

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

const displayedMissions = computed(() => {
  if (activeTab.value === 'pending') return pendingMissions.value
  if (activeTab.value === 'completed') return completedMissions.value
  return userMissions.value
})

const availableMissions = computed(() => {
  const userMissionIds = new Set(userMissions.value.map(um => um.missionId))
  return allMissions.value.filter(m => !userMissionIds.has(m.id))
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

