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
          class="opacity-70 transition-opacity hover:opacity-100 motion-safe:animate-float-slow"
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
              @keydown.enter.prevent="handleNameEnter"
            />
          </div>
          <div>
            <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
              <span>Dream Job</span>
              <span class="text-destructive">*</span>
            </Label>
            <SearchableSelect
              ref="dreamJobSelect"
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
          <Button variant="outline" class="w-full" @click="showAddDialog = false">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="showEditDialog" @update:open="handleEditDialogOpenChange">
      <DialogContent class="max-w-md">
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogTitle class="flex items-center gap-2">
            <span class="text-2xl">✏️</span>
            <span>Edit Resident</span>
          </DialogTitle>
        </div>

        <div class="space-y-4">
          <div>
            <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
              <span>Name</span>
              <span class="text-destructive">*</span>
            </Label>
            <Input v-model="editName" placeholder="e.g., John Smith" />
          </div>

          <div>
            <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
              <span>Dream Job</span>
              <span class="text-destructive">*</span>
            </Label>
            <SearchableSelect
              v-model="editDreamJob"
              :items="storeItems"
              placeholder="Choose their dream job..."
              search-placeholder="Search stores…"
            />
          </div>

          <div>
            <Label class="mb-2 flex items-center gap-1 text-sm font-medium">
              <span>Current Store</span>
            </Label>
            <SearchableSelect
              v-model="editCurrentStore"
              :items="builtStoreItems"
              placeholder="Assign to a built store..."
              search-placeholder="Search built stores…"
            />
            <p class="mt-1 text-xs text-muted-foreground">This is where they currently work</p>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-2">
          <Button
            class="w-full"
            :disabled="!editName.trim() || !editDreamJob.trim()"
            @click="handleSaveResidentEdits"
          >
            Save Changes
          </Button>
          <Button variant="outline" class="w-full" @click="showEditDialog = false">Cancel</Button>
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

    <div v-else>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          v-model="searchQuery"
          placeholder="Search residents, dream jobs, stores..."
          class="w-full sm:max-w-md"
        />
        <div class="flex flex-wrap gap-2">
          <Button
            size="sm"
            :variant="quickFilter === 'all' ? 'secondary' : 'outline'"
            @click="quickFilter = 'all'"
          >
            All ({{ residentCounts.all }})
          </Button>
          <Button
            size="sm"
            :variant="quickFilter === 'attention' ? 'secondary' : 'outline'"
            @click="quickFilter = 'attention'"
          >
            Needs Attention ({{ residentCounts.attention }})
          </Button>
          <Button
            size="sm"
            :variant="quickFilter === 'in-progress' ? 'secondary' : 'outline'"
            @click="quickFilter = 'in-progress'"
          >
            In Progress ({{ residentCounts.inProgress }})
          </Button>
          <Button
            size="sm"
            :variant="quickFilter === 'settled' ? 'secondary' : 'outline'"
            @click="quickFilter = 'settled'"
          >
            All Set ({{ residentCounts.settled }})
          </Button>
          <Button
            size="sm"
            :variant="quickFilter === 'unassigned' ? 'secondary' : 'outline'"
            @click="quickFilter = 'unassigned'"
          >
            Unassigned ({{ residentCounts.unassigned }})
          </Button>
        </div>
      </div>

      <EmptyState
        v-if="filteredResidentsWithState.length === 0"
        title="No matches"
        description="Try a different search or clear filters."
        :hide-illustration="true"
      />

      <div v-if="attentionResidents.length > 0" class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <span>Needs Attention</span>
          </h2>
          <span class="text-sm text-muted-foreground">{{ attentionResidents.length }}</span>
        </div>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <ResidentCard
            v-for="item in attentionResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :stores="allStores ?? []"
            :current-store="item.currentStore"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            :dream-job-demand-count="dreamJobDemandCount.get(item.resident.dreamJob) ?? 0"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </TransitionGroup>
      </div>

      <div v-if="inProgressResidents.length > 0" class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <span>In Progress</span>
          </h2>
          <span class="text-sm text-muted-foreground">{{ inProgressResidents.length }}</span>
        </div>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <ResidentCard
            v-for="item in inProgressResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :stores="allStores ?? []"
            :current-store="item.currentStore"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            :dream-job-demand-count="dreamJobDemandCount.get(item.resident.dreamJob) ?? 0"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </TransitionGroup>
      </div>

      <div v-if="settledResidents.length > 0">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <span>All Set</span>
          </h2>
          <span class="text-sm text-muted-foreground">{{ settledResidents.length }}</span>
        </div>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <ResidentCard
            v-for="item in settledResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :stores="allStores ?? []"
            :current-store="item.currentStore"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            :dream-job-demand-count="dreamJobDemandCount.get(item.resident.dreamJob) ?? 0"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </TransitionGroup>
      </div>
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
const showEditDialog = ref(false)

const searchQuery = ref('')
const quickFilter = ref<'all' | 'attention' | 'in-progress' | 'settled' | 'unassigned'>('all')

const editingResidentId = ref<string | null>(null)
const editName = ref('')
const editDreamJob = ref('')
const editCurrentStore = ref('__none__')
const newResidentName = ref('')
const newResidentDreamJob = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const dreamJobSelect = ref<{
  openMenu?: () => void
  closeMenu?: () => void
  focusTrigger?: () => void
} | null>(null)

const storeItems = computed(() => {
  if (!allStores.value) {
    return []
  }
  return allStores.value.map(store => ({ value: store.id, label: store.name }))
})

const dreamJobDemandCount = computed(() => {
  const map = new Map<string, number>()
  for (const resident of residents) {
    map.set(resident.dreamJob, (map.get(resident.dreamJob) ?? 0) + 1)
  }
  return map
})

const builtStoreItems = computed(() => {
  const built = userStores.value
    .map((us: UserStore & { store: Store }) => ({ value: us.storeId, label: us.store.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ value: '__none__', label: 'Unassigned' }, ...built]
})

const storeNameById = computed(() => {
  const map = new Map<string, string>()
  for (const s of allStores.value ?? []) {
    map.set(s.id, s.name)
  }
  return map
})

const residentById = computed(() => {
  const map = new Map<string, Resident>()
  for (const resident of residents) {
    map.set(resident.id, resident)
  }
  return map
})

const builtStoreIds = computed(() => {
  return new Set(userStores.value.map((us: UserStore & { store: Store }) => us.storeId))
})

const storeOccupancyCountById = computed(() => {
  const map = new Map<string, number>()
  for (const us of userStores.value) {
    map.set(us.storeId, us.residents.length)
  }
  return map
})

const residentsWithState = computed(() => {
  return residents.map((resident: Resident) => {
    const currentStore = residentsStore.getCurrentStore(resident.id)
    const isSettled = !!currentStore && currentStore === resident.dreamJob
    const needsPlacement = !currentStore || currentStore !== resident.dreamJob
    const dreamJobStoreBuilt = builtStoreIds.value.has(resident.dreamJob)
    const dreamJobStoreFull =
      (storeOccupancyCountById.value.get(resident.dreamJob) ?? 0) >=
      APP_CONSTANTS.MAX_STORE_CAPACITY
    const demand = dreamJobDemandCount.value.get(resident.dreamJob) ?? 0

    // "Needs Attention" should be actionable/meaningful:
    // - Place in dream job now (built + has room)
    // - Dream job store not built, but you have a full crew ready (3)
    // - Dream job store is built but full (blocked)
    const canPlaceInDreamJob = needsPlacement && dreamJobStoreBuilt && !dreamJobStoreFull
    const shouldBuildDreamStore = needsPlacement && !dreamJobStoreBuilt && demand >= 3
    const dreamStoreFull = needsPlacement && dreamJobStoreBuilt && dreamJobStoreFull
    const needsAttention =
      !isSettled && (canPlaceInDreamJob || shouldBuildDreamStore || dreamStoreFull)

    return {
      resident,
      currentStore,
      isSettled,
      needsAttention,
      dreamJobStoreBuilt,
      dreamJobStoreFull,
    }
  })
})

const residentCounts = computed(() => {
  const all = residentsWithState.value.length
  const settled = residentsWithState.value.filter(r => r.isSettled).length
  const attention = residentsWithState.value.filter(r => r.needsAttention).length
  const inProgress = residentsWithState.value.filter(r => !r.isSettled && !r.needsAttention).length
  const unassigned = residentsWithState.value.filter(r => !r.currentStore).length
  return { all, attention, inProgress, settled, unassigned }
})

const filteredResidentsWithState = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let list = residentsWithState.value

  if (quickFilter.value === 'attention') {
    list = list.filter(r => r.needsAttention)
  } else if (quickFilter.value === 'in-progress') {
    list = list.filter(r => !r.isSettled && !r.needsAttention)
  } else if (quickFilter.value === 'settled') {
    list = list.filter(r => r.isSettled)
  } else if (quickFilter.value === 'unassigned') {
    list = list.filter(r => !r.currentStore)
  }

  if (!query) {
    return list
  }

  return list.filter(r => {
    const name = formatResidentName(r.resident.name).toLowerCase()
    const dreamJobName = (
      storeNameById.value.get(r.resident.dreamJob) ?? r.resident.dreamJob
    ).toLowerCase()
    const currentStoreName = (
      r.currentStore ? (storeNameById.value.get(r.currentStore) ?? r.currentStore) : 'unassigned'
    ).toLowerCase()

    return name.includes(query) || dreamJobName.includes(query) || currentStoreName.includes(query)
  })
})

const attentionResidents = computed(() =>
  filteredResidentsWithState.value.filter(r => r.needsAttention)
)
const inProgressResidents = computed(() =>
  filteredResidentsWithState.value.filter(r => !r.isSettled && !r.needsAttention)
)
const settledResidents = computed(() => filteredResidentsWithState.value.filter(r => r.isSettled))

function handleEditDialogOpenChange(isOpen: boolean) {
  showEditDialog.value = isOpen
  if (!isOpen) {
    editingResidentId.value = null
    editName.value = ''
    editDreamJob.value = ''
    editCurrentStore.value = '__none__'
  }
}

function openEditResident(residentId: string) {
  const resident = residentById.value.get(residentId)
  if (!resident) {
    return
  }

  editingResidentId.value = residentId
  editName.value = resident.name
  editDreamJob.value = resident.dreamJob
  const currentStore = residentsStore.getCurrentStore(residentId)
  editCurrentStore.value = currentStore ?? '__none__'
  showEditDialog.value = true
}

function handleSaveResidentEdits() {
  if (!editingResidentId.value) {
    return
  }

  const resident = residentById.value.get(editingResidentId.value)
  if (!resident) {
    toast.error('Resident not found')
    return
  }

  const currentStore = residentsStore.getCurrentStore(editingResidentId.value)

  // Update current store assignment first (can fail due to capacity)
  if (editCurrentStore.value === '__none__') {
    if (currentStore) {
      const success = storesStore.removeResidentFromStore(currentStore, editingResidentId.value)
      if (!success) {
        toast.error('Failed to unassign resident')
        return
      }
    }
  } else if (editCurrentStore.value !== currentStore) {
    const result = storesStore.addResidentToStore(editCurrentStore.value, editingResidentId.value)
    if (!result.success) {
      toast.error(result.error ?? 'Failed to move resident')
      return
    }
  }

  // Update resident fields
  try {
    const success = residentsStore.updateResident(editingResidentId.value, {
      name: editName.value,
      dreamJob: editDreamJob.value,
    })
    if (!success) {
      toast.error('Failed to update resident')
      return
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Invalid resident details')
    return
  }

  toast.success(`Saved ${formatResidentName(editName.value)}`)
  showEditDialog.value = false
}

function handleDialogOpenChange(isOpen: boolean) {
  showAddDialog.value = isOpen
  if (isOpen) {
    // Auto-focus name input when dialog opens (but not on mobile)
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        nameInput.value?.focus()
      }
    }, 100)
    return
  }

  // Reset draft values when closing (consistent with other dialogs)
  newResidentName.value = ''
  newResidentDreamJob.value = ''
}

function handleNameEnter() {
  if (newResidentName.value && newResidentDreamJob.value) {
    handleAddResident()
    return
  }
  // If they haven't picked a dream job yet, open the picker.
  dreamJobSelect.value?.openMenu?.()
}

function handleAddResident() {
  if (newResidentName.value && newResidentDreamJob.value) {
    const result = residentsStore.addResident(newResidentName.value, newResidentDreamJob.value)
    if (result.success) {
      const dreamJobStoreName =
        storeNameById.value.get(newResidentDreamJob.value) ?? newResidentDreamJob.value
      toast.success(
        `✓ Added ${formatResidentName(newResidentName.value)} (wants ${dreamJobStoreName})`
      )
      newResidentName.value = ''
      newResidentDreamJob.value = ''
      showAddDialog.value = false
    } else {
      toast.error(result.error ?? 'Failed to add resident')
    }
  }
}

function handlePlaceInDreamJob(residentId: string) {
  const resident = residentById.value.get(residentId)
  if (!resident) return

  const result = storesStore.addResidentToStore(resident.dreamJob, residentId)
  if (result.success) {
    const storeName = storeNameById.value.get(resident.dreamJob) ?? resident.dreamJob
    toast.success(`✨ Placed ${formatResidentName(resident.name)} in their dream job: ${storeName}`)
  } else {
    toast.error(result.error ?? 'Failed to place resident')
  }
}

function handleRemoveResident(id: string) {
  const resident = residentById.value.get(id)
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
