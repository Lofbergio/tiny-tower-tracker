<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Residents</h1>
        <p class="text-sm text-muted-foreground">
          Manage your tower's residents and their dream jobs
        </p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogContent>
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle>Add Resident</DialogTitle>
          </div>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Name</Label>
              <Input v-model="newResidentName" placeholder="Enter resident name" />
            </div>
            <div>
              <Label class="mb-2 block">Dream Job</Label>
              <SearchableSelect
                v-model="newResidentDreamJob"
                :items="storeItems"
                placeholder="Choose a store..."
                search-placeholder="Search stores…"
              />
            </div>
          </div>
          <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
            <Button :disabled="!newResidentName || !newResidentDreamJob" @click="handleAddResident">
              Add
            </Button>
          </div>
        </DialogContent>
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
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useResidents } from '@/composables/useResidents'
import { loadStores, useStores } from '@/composables/useStores'
import { computed, onMounted, ref } from 'vue'

const { residents, addResident, removeResident: removeResidentFn } = useResidents()
const { allStores } = useStores()

const showAddDialog = ref(false)
const newResidentName = ref('')
const newResidentDreamJob = ref('')

const storeItems = computed(() => {
  return allStores.value.map(store => ({ value: store.id, label: store.name }))
})

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
