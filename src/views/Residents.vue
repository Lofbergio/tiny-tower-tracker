<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Residents</h1>
        <p class="text-muted-foreground text-sm">
          Manage your tower's residents and their dream jobs
        </p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogHeader>
          <DialogTitle>Add Resident</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Name</Label>
              <Input v-model="newResidentName" placeholder="Enter resident name" />
            </div>
            <div>
              <Label class="mb-2 block">Dream Job</Label>
              <Select v-model="newResidentDreamJob" placeholder="Choose a store...">
                <SelectItem v-for="store in allStores" :key="store.id" :value="store.id">
                  {{ store.name }}
                </SelectItem>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
          <Button @click="handleAddResident" :disabled="!newResidentName || !newResidentDreamJob">
            Add
          </Button>
        </DialogFooter>
      </Dialog>
      <Button @click="showAddDialog = true">Add Resident</Button>
    </div>

    <EmptyState
      v-if="residents.length === 0"
      title="No Residents Yet"
      description="Add residents to your tower and assign them to their dream jobs!"
    >
      <Button @click="showAddDialog = true">Add Your First Resident</Button>
    </EmptyState>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ResidentCard
        v-for="resident in residents"
        :key="resident.id"
        :resident="resident"
        :stores="allStores"
        @remove-resident="handleRemoveResident(resident.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ResidentCard from '@/components/ResidentCard.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import { useResidents } from '@/composables/useResidents'
import { loadStores, useStores } from '@/composables/useStores'
import { onMounted, ref } from 'vue'

const { residents, addResident, removeResident: removeResidentFn } = useResidents()
const { allStores } = useStores()

const showAddDialog = ref(false)
const newResidentName = ref('')
const newResidentDreamJob = ref('')

function handleAddResident() {
  if (newResidentName.value && newResidentDreamJob.value) {
    addResident(newResidentName.value, newResidentDreamJob.value)
    newResidentName.value = ''
    newResidentDreamJob.value = ''
    showAddDialog.value = false
  }
}

function handleRemoveResident(id: string) {
  removeResidentFn(id)
}

onMounted(async () => {
  await loadStores()
})
</script>
