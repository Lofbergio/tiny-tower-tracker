<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <PageHeader icon="👥">
      <template #title>
        <span
          class="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400"
        >
          Residents
        </span>
      </template>
      <template #subtitle>Manage residents and place them in their dream jobs</template>
      <template #actions>
        <Button variant="outline" class="w-full sm:w-auto" @click="showImportDialog = true">
          Import Screenshots
        </Button>
        <Button class="w-full sm:w-auto" @click="showAddDialog = true">
          <span class="sm:hidden">Add</span>
          <span class="hidden sm:inline">Add Resident</span>
        </Button>
      </template>
      <template #aside>
        <TowerIllustration
          :width="110"
          :height="165"
          class="motion-safe:animate-float-slow opacity-70 transition-opacity hover:opacity-100"
        />
      </template>
    </PageHeader>

    <ResidentScreenshotImportDialog
      :open="showImportDialog"
      :stores="allStores"
      :user-stores="userStores"
      :confirm="confirm"
      @update:open="showImportDialog = $event"
    />

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
            <p class="mt-1 text-xs text-muted-foreground">The store they want to work in</p>
          </div>
        </div>
        <div class="mt-6 flex flex-col gap-2">
          <Button
            :disabled="!newResidentName || !newResidentDreamJob"
            class="w-full"
            @click="handleAddResident"
          >
            <span v-if="!newResidentName || !newResidentDreamJob">Add Resident</span>
            <span v-else>Add {{ newResidentName }}</span>
          </Button>
          <Button variant="ghost" class="w-full" @click="showAddDialog = false">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>

    <EmptyState
      v-if="residents.length === 0"
      title="No Residents Yet"
      description="Add residents to your tower and assign them to their dream jobs!"
      :icon="ResidentsEmptyIcon"
    >
      <Button @click="showAddDialog = true">Add Your First Resident</Button>
    </EmptyState>

    <TransitionGroup
      v-else
      tag="div"
      name="list"
      class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <ResidentCard
        v-for="resident in residents"
        :key="resident.id"
        :resident="resident"
        :stores="allStores ?? []"
        :current-store="residentsStore.getCurrentStore(resident.id)"
        :dream-job-store-full="isDreamJobStoreFull(resident.dreamJob)"
        @remove-resident="handleRemoveResident(resident.id)"
        @place-in-dream-job="handlePlaceInDreamJob(resident.id)"
        @assign-to-store="handleAssignToStore(resident.id)"
      />
    </TransitionGroup>

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
import PageHeader from '@/components/PageHeader.vue'
import ResidentCard from '@/components/ResidentCard.vue'
import ResidentScreenshotImportDialog from '@/components/ResidentScreenshotImportDialog.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import ResidentsEmptyIcon from '@/components/illustrations/ResidentsEmptyIcon.vue'
import Button from '@/components/ui/Button.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { APP_CONSTANTS } from '@/constants'
import { useStoresQuery, useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store, UserStore } from '@/types'
import { formatResidentName } from '@/utils/residentName'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const residentsStore = useResidentsStore()
const storesStore = useStoresStore()
const { residents } = residentsStore
const { data: allStores } = useStoresQuery()
const { userStores } = useUserStoresWithData()
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const newResidentName = ref('')
const newResidentDreamJob = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

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
        nameInput.value?.focus()
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
      toast.success(
        `✓ Added ${formatResidentName(newResidentName.value)} (wants ${dreamJobStore?.name})`
      )
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
    (us: UserStore & { store: Store }) => us.storeId === dreamJobStoreId
  )
  if (!userStore) return false
  return storesStore.isStoreFull(dreamJobStoreId)
}

function handlePlaceInDreamJob(residentId: string) {
  const resident = residents.find((r: Resident) => r.id === residentId)
  if (!resident) return

  const result = storesStore.addResidentToStore(resident.dreamJob, residentId)
  if (result.success) {
    const store = allStores.value?.find(s => s.id === resident.dreamJob)
    toast.success(
      `✨ Placed ${formatResidentName(resident.name)} in their dream job: ${store?.name}`
    )
  } else {
    toast.error(result.error ?? 'Failed to place resident')
  }
}

function handleAssignToStore(residentId: string) {
  const resident = residents.find((r: Resident) => r.id === residentId)
  if (!resident) return

  // Find stores that have space and this resident wants to work at
  const currentStore = residentsStore.getCurrentStore(residentId)
  const availableStores = userStores.value.filter((us: UserStore & { store: Store }) => {
    const store = allStores.value?.find(s => s.id === us.storeId)
    const hasSpace = us.residents.length < APP_CONSTANTS.MAX_STORE_CAPACITY
    const isDreamJob = us.storeId === resident.dreamJob
    return hasSpace && store && (isDreamJob || !currentStore)
  })

  if (availableStores.length === 0) {
    toast.info('No available stores with space')
    return
  }

  // Prefer dream job store
  const dreamJobStore = availableStores.find(
    (us: UserStore & { store: Store }) => us.storeId === resident.dreamJob
  )
  const targetStore = dreamJobStore || availableStores[0]

  const result = storesStore.addResidentToStore(targetStore.storeId, residentId)
  if (result.success) {
    const store = allStores.value?.find(s => s.id === targetStore.storeId)
    toast.success(`📍 Placed ${formatResidentName(resident.name)} in ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to assign resident')
  }
}

function handleRemoveResident(id: string) {
  const resident = residents.find((r: { id: string }) => r.id === id)
  if (!resident) {
    return
  }

  confirm({
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
  })
}
</script>
