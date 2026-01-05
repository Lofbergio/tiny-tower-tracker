<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <PageHeader icon="👥">
      <template #title>Residents</template>
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
        <div class="pr-10">
          <DialogTitle>👤 Add New Resident</DialogTitle>
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
        <div class="pr-10">
          <DialogTitle>✏️ Edit Resident</DialogTitle>
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
      <Button @click="showAddDialog = true">Add Resident</Button>
    </EmptyState>

    <div v-else>
      <!-- Overdemand warning -->
      <div
        v-if="overdemandedStores.length > 0"
        class="mb-4 space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4"
      >
        <div class="flex items-start gap-2">
          <span class="text-lg">⚠️</span>
          <div class="flex-1">
            <h3 class="font-semibold text-amber-900 dark:text-amber-100">Store Capacity Issues</h3>
            <p class="mt-1 text-sm text-amber-800 dark:text-amber-200">
              These stores have more residents than they can hold (max 3 per store):
            </p>
            <ul class="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
              <li
                v-for="store in overdemandedStores"
                :key="store.storeId"
                class="flex items-center gap-2"
              >
                <span class="font-semibold">{{ store.storeName }}</span>
                <span class="text-xs opacity-75">{{ store.count }} residents</span>
                <span v-if="!store.isBuilt" class="text-xs opacity-75">(unbuilt)</span>
              </li>
            </ul>
            <p class="mt-2 text-xs text-amber-700 dark:text-amber-300">
              💡 Remove extra residents before building, or you'll need to manage who gets placed
            </p>
          </div>
        </div>
      </div>

      <div class="mb-6 space-y-3">
        <Input
          v-model="searchQuery"
          placeholder="Search residents, dream jobs, stores..."
          class="w-full sm:max-w-md"
        />
        <div class="flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-1.5">
          <button
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              quickFilter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="quickFilter = 'all'"
          >
            All
            <span class="ml-1 tabular-nums opacity-70">{{ residentCounts.all }}</span>
          </button>
          <button
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              quickFilter === 'ready'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="quickFilter = 'ready'"
          >
            Ready
            <span class="ml-1 tabular-nums opacity-70">{{ residentCounts.readyToPlace }}</span>
          </button>
          <button
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              quickFilter === 'working'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="quickFilter = 'working'"
          >
            Employed
            <span class="ml-1 tabular-nums opacity-70">{{ residentCounts.workingElsewhere }}</span>
          </button>
          <button
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              quickFilter === 'waiting'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="quickFilter = 'waiting'"
          >
            Waiting
            <span class="ml-1 tabular-nums opacity-70">{{ residentCounts.waitingForStore }}</span>
          </button>
          <button
            :class="[
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              quickFilter === 'dream-job'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="quickFilter = 'dream-job'"
          >
            Dream Job
            <span class="ml-1 tabular-nums opacity-70">{{ residentCounts.dreamJob }}</span>
          </button>
        </div>
      </div>

      <EmptyState
        v-if="filteredResidentsWithState.length === 0"
        title="No matches"
        description="Try a different search or clear filters."
        :hide-illustration="true"
      />

      <!-- Ready - can move to dream job NOW -->
      <div v-if="readyToPlaceResidents.length > 0" class="mb-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Ready</h2>
          <span class="text-sm text-muted-foreground">{{ readyToPlaceResidents.length }}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ResidentCard
            v-for="item in readyToPlaceResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :current-store="item.currentStore"
            :dream-job-name="item.dreamJobName"
            :current-store-name="item.currentStoreName"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </div>
      </div>

      <!-- In Progress - has a job but not dream job -->
      <div v-if="workingElsewhereResidents.length > 0" class="mb-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">In Progress</h2>
          <span class="text-sm text-muted-foreground">{{ workingElsewhereResidents.length }}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ResidentCard
            v-for="item in workingElsewhereResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :current-store="item.currentStore"
            :dream-job-name="item.dreamJobName"
            :current-store-name="item.currentStoreName"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </div>
      </div>

      <!-- Waiting - dream job store not built yet -->
      <div v-if="waitingForStoreResidents.length > 0" class="mb-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Waiting</h2>
          <span class="text-sm text-muted-foreground">{{ waitingForStoreResidents.length }}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ResidentCard
            v-for="item in waitingForStoreResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :current-store="item.currentStore"
            :dream-job-name="item.dreamJobName"
            :current-store-name="item.currentStoreName"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </div>
      </div>

      <!-- Dream Job - living the dream! -->
      <div v-if="dreamJobResidents.length > 0">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Dream Job</h2>
          <span class="text-sm text-muted-foreground">{{ dreamJobResidents.length }}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ResidentCard
            v-for="item in dreamJobResidents"
            :key="item.resident.id"
            :resident="item.resident"
            :current-store="item.currentStore"
            :dream-job-name="item.dreamJobName"
            :current-store-name="item.currentStoreName"
            :dream-job-store-built="item.dreamJobStoreBuilt"
            :dream-job-store-full="item.dreamJobStoreFull"
            @remove-resident="handleRemoveResident(item.resident.id)"
            @place-in-dream-job="handlePlaceInDreamJob(item.resident.id)"
            @edit-resident="openEditResident(item.resident.id)"
          />
        </div>
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
const quickFilter = ref<'all' | 'ready' | 'working' | 'waiting' | 'dream-job'>('ready')

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

const overdemandedStores = computed(() => {
  const result: Array<{ storeId: string; storeName: string; count: number; isBuilt: boolean }> = []

  for (const [storeId, count] of dreamJobDemandCount.value.entries()) {
    // Warn if more than 3 residents want this store (regardless of built status)
    if (count > APP_CONSTANTS.MAX_STORE_CAPACITY) {
      const storeName = storeNameById.value.get(storeId) ?? storeId
      const isBuilt = builtStoreIds.value.has(storeId)
      result.push({ storeId, storeName, count, isBuilt })
    }
  }

  // Sort by count descending (most overdemanded first)
  return result.sort((a, b) => b.count - a.count)
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
  const storeNames = storeNameById.value
  return residents.map((resident: Resident) => {
    const currentStore = residentsStore.getCurrentStore(resident.id)
    const isSettled = !!currentStore && currentStore === resident.dreamJob
    const dreamJobStoreBuilt = builtStoreIds.value.has(resident.dreamJob)
    const dreamJobStoreFull =
      (storeOccupancyCountById.value.get(resident.dreamJob) ?? 0) >=
      APP_CONSTANTS.MAX_STORE_CAPACITY

    // Pre-resolve store names once (not per-card)
    const dreamJobName = storeNames.get(resident.dreamJob) ?? resident.dreamJob
    const currentStoreName = currentStore ? storeNames.get(currentStore) ?? currentStore : undefined

    // Clear, mutually exclusive categories:
    // 1. Dream Job ✨ - Living the dream
    // 2. Ready to Place ⭐ - Dream store built with room, can move now
    // 3. Working Elsewhere 💼 - Has a job but not dream job
    // 4. Waiting for Store 🏗️ - Dream store not built yet (unemployed)
    const canPlaceInDreamJob = !isSettled && dreamJobStoreBuilt && !dreamJobStoreFull
    const isWorkingElsewhere = !isSettled && !!currentStore && currentStore !== resident.dreamJob
    const isWaitingForStore = !isSettled && !currentStore && !dreamJobStoreBuilt

    return {
      resident,
      currentStore,
      dreamJobName,
      currentStoreName,
      isSettled,
      canPlaceInDreamJob,
      isWorkingElsewhere,
      isWaitingForStore,
      dreamJobStoreBuilt,
      dreamJobStoreFull,
    }
  })
})

const residentCounts = computed(() => {
  const all = residentsWithState.value.length
  const dreamJob = residentsWithState.value.filter(r => r.isSettled).length
  const readyToPlace = residentsWithState.value.filter(r => r.canPlaceInDreamJob).length
  const workingElsewhere = residentsWithState.value.filter(r => r.isWorkingElsewhere).length
  const waitingForStore = residentsWithState.value.filter(r => r.isWaitingForStore).length
  return { all, dreamJob, readyToPlace, workingElsewhere, waitingForStore }
})

const filteredResidentsWithState = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let list = residentsWithState.value

  if (quickFilter.value === 'ready') {
    list = list.filter(r => r.canPlaceInDreamJob)
  } else if (quickFilter.value === 'working') {
    list = list.filter(r => r.isWorkingElsewhere)
  } else if (quickFilter.value === 'waiting') {
    list = list.filter(r => r.isWaitingForStore)
  } else if (quickFilter.value === 'dream-job') {
    list = list.filter(r => r.isSettled)
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

const readyToPlaceResidents = computed(() =>
  filteredResidentsWithState.value.filter(r => r.canPlaceInDreamJob)
)
const workingElsewhereResidents = computed(() =>
  filteredResidentsWithState.value.filter(r => r.isWorkingElsewhere)
)
const waitingForStoreResidents = computed(() =>
  filteredResidentsWithState.value.filter(r => r.isWaitingForStore)
)
const dreamJobResidents = computed(() => filteredResidentsWithState.value.filter(r => r.isSettled))

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
