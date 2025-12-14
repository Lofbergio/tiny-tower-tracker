<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex-1">
        <h1 class="mb-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">👥</span>
          Residents
        </h1>
        <p class="text-muted-foreground text-sm md:text-base">
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
              <Input
                v-model="newResidentName"
                placeholder="Enter resident name"
                @keydown.enter="handleAddResident"
              />
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
      <Button class="w-full sm:w-auto" @click="showAddDialog = true">
        <span class="sm:hidden">Add</span>
        <span class="hidden sm:inline">Add Resident</span>
      </Button>
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
        :stores="allStores ?? []"
        @remove-resident="handleRemoveResident(resident.id)"
      />
    </div>

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
import ResidentCard from '@/components/ResidentCard.vue'
import Button from '@/components/ui/Button.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useStoresQuery } from '@/queries'
import { useResidentsStore } from '@/stores'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const residentsStore = useResidentsStore()
const { residents } = residentsStore
const { data: allStores } = useStoresQuery()
const toast = useToast()

const showAddDialog = ref(false)
const newResidentName = ref('')
const newResidentDreamJob = ref('')
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

const storeItems = computed(() => {
  if (!allStores.value) {
    return []
  }
  return allStores.value.map(store => ({ value: store.id, label: store.name }))
})

function handleAddResident() {
  if (newResidentName.value && newResidentDreamJob.value) {
    const result = residentsStore.addResident(newResidentName.value, newResidentDreamJob.value)
    if (result.success) {
      toast.success(`Added ${newResidentName.value} to your tower`)
      newResidentName.value = ''
      newResidentDreamJob.value = ''
      showAddDialog.value = false
    } else {
      toast.error(result.error ?? 'Failed to add resident')
    }
  }
}

function handleRemoveResident(id: string) {
  const resident = residents.find((r: { id: string }) => r.id === id)
  if (!resident) {
    return
  }

  confirmDialogData.value = {
    title: 'Remove Resident',
    message: `Are you sure you want to remove ${resident.name}? This will also remove them from any stores they're assigned to.`,
    variant: 'destructive',
    confirmText: 'Remove',
    onConfirm: () => {
      const success = residentsStore.removeResident(id)
      if (success) {
        toast.success(`Removed ${resident.name}`)
      } else {
        toast.error('Failed to remove resident')
      }
    },
  }
  showConfirmDialog.value = true
}
</script>
