<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Residents</h1>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogHeader>
          <DialogTitle>Add Resident</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Name</label>
              <Input v-model="newResidentName" placeholder="Enter resident name" />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Dream Job</label>
              <Select v-model="newResidentDreamJob">
                <option value="">Choose a store...</option>
                <option
                  v-for="store in allStores"
                  :key="store.id"
                  :value="store.id"
                >
                  {{ store.name }}
                </option>
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

    <div v-if="residents.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">No residents added yet.</p>
    </div>

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
import { ref, onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Select from '@/components/ui/Select.vue'
import ResidentCard from '@/components/ResidentCard.vue'
import { useResidents } from '@/composables/useResidents'
import { useStores, loadStores } from '@/composables/useStores'

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

