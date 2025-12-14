<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex-1">
        <h1 class="mb-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">👥</span>
          <span
            class="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400"
          >
            Residents
          </span>
        </h1>
        <p class="text-muted-foreground text-sm md:text-base">
          Manage residents and place them in their dream jobs ✨
        </p>
      </div>
      <Dialog :open="showAddDialog" @update:open="handleDialogOpenChange">
        <DialogContent class="max-w-md">
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle class="flex items-center gap-2">
              <span class="text-2xl">👤</span>
              <span>Add New Resident</span>
            </DialogTitle>
          </div>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
                <span>Name</span>
                <span class="text-destructive">*</span>
              </Label>
              <Input
                ref="nameInput"
                v-model="newResidentName"
                placeholder="e.g., John Smith"
                @keydown.enter="focusDreamJobSelect"
              />
            </div>
            <div>
              <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
                <span>Dream Job</span>
                <span class="text-destructive">*</span>
              </Label>
              <SearchableSelect
                v-model="newResidentDreamJob"
                :items="storeItems"
                placeholder="Choose their dream job..."
                search-placeholder="Search stores…"
              />
              <p class="text-muted-foreground mt-1 text-xs">The store they want to work in</p>
            </div>
          </div>
          <div class="mt-6 flex flex-col gap-2">
            <Button
              :disabled="!newResidentName || !newResidentDreamJob"
              class="w-full"
              @click="handleAddResident"
            >
              <span v-if="!newResidentName || !newResidentDreamJob">✨ Add Resident</span>
              <span v-else>✨ Add {{ newResidentName }}</span>
            </Button>
            <Button variant="ghost" class="w-full" @click="showAddDialog = false">Cancel</Button>
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
      title="👋 No Residents Yet"
      description="Add residents to your tower and assign them to their dream jobs!"
    >
      <Button @click="showAddDialog = true">✨ Add Your First Resident</Button>
    </EmptyState>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ResidentCard
        v-for="resident in residents"
        :key="resident.id"
        :resident="resident"
        :stores="allStores ?? []"
        :dream-job-store-full="isDreamJobStoreFull(resident.dreamJob)"
        @remove-resident="handleRemoveResident(resident.id)"
        @place-in-dream-job="handlePlaceInDreamJob(resident.id)"
        @assign-to-store="handleAssignToStore(resident.id)"
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
import { useStoresQuery, useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const residentsStore = useResidentsStore()
const storesStore = useStoresStore()
const { residents } = residentsStore
const { data: allStores } = useStoresQuery()
const { userStores } = useUserStoresWithData()
const toast = useToast()

const showAddDialog = ref(false)
const newResidentName = ref('')
const newResidentDreamJob = ref('')
const showConfirmDialog = ref(false)
const nameInput = ref<{ focus?: () => void } | null>(null)
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

function handleDialogOpenChange(isOpen: boolean) {
  showAddDialog.value = isOpen
  if (isOpen) {
    // Auto-focus name input when dialog opens (but not on mobile)
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        nameInput.value?.focus?.()
      }
    }, 100)
  }
}

function focusDreamJobSelect() {
  // If name is filled and user presses enter, we could add logic here
  // For now, just prevent form submission
  if (newResidentName.value && newResidentDreamJob.value) {
    handleAddResident()
  }
}

function handleAddResident() {
  if (newResidentName.value && newResidentDreamJob.value) {
    const result = residentsStore.addResident(newResidentName.value, newResidentDreamJob.value)
    if (result.success) {
      const dreamJobStore = allStores.value?.find(s => s.id === newResidentDreamJob.value)
      toast.success(`✓ Added ${newResidentName.value} (wants ${dreamJobStore?.name})`, 4000)
      newResidentName.value = ''
      newResidentDreamJob.value = ''
      showAddDialog.value = false
    } else {
      toast.error(result.error ?? 'Failed to add resident')
    }
  }
}

function isDreamJobStoreFull(dreamJobStoreId: string): boolean {
  const userStore = userStores.value.find(
    (us: { storeId: string }) => us.storeId === dreamJobStoreId
  )
  if (!userStore) return false
  return storesStore.isStoreFull(dreamJobStoreId)
}

function handlePlaceInDreamJob(residentId: string) {
  const resident = residents.find((r: { id: string }) => r.id === residentId)
  if (!resident) return

  const result = storesStore.addResidentToStore(resident.dreamJob, residentId)
  if (result.success) {
    const store = allStores.value?.find(s => s.id === resident.dreamJob)
    toast.success(`✨ Placed ${resident.name} in their dream job: ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to place resident')
  }
}

function handleAssignToStore(residentId: string) {
  const resident = residents.find((r: { id: string }) => r.id === residentId)
  if (!resident) return

  // Find stores that have space and this resident wants to work at
  const availableStores = userStores.value.filter(
    (us: { storeId: string; residents: string[] }) => {
      const store = allStores.value?.find(s => s.id === us.storeId)
      const hasSpace = us.residents.length < 3
      const isDreamJob = us.storeId === resident.dreamJob
      return hasSpace && store && (isDreamJob || !resident.currentStore)
    }
  )

  if (availableStores.length === 0) {
    toast.info('No available stores with space')
    return
  }

  // Prefer dream job store
  const dreamJobStore = availableStores.find(
    (us: { storeId: string }) => us.storeId === resident.dreamJob
  )
  const targetStore = dreamJobStore || availableStores[0]

  const result = storesStore.addResidentToStore(targetStore.storeId, residentId)
  if (result.success) {
    const store = allStores.value?.find(s => s.id === targetStore.storeId)
    toast.success(`📍 Placed ${resident.name} in ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to assign resident')
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
