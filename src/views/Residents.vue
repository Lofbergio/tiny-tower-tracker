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
        <p class="text-sm text-muted-foreground md:text-base">
          Manage residents and place them in their dream jobs
        </p>
      </div>

      <Dialog :open="showImportDialog" @update:open="handleImportDialogOpenChange">
        <DialogContent class="max-w-2xl">
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle class="flex items-center gap-2">
              <span class="text-2xl">📸</span>
              <span>Import Residents from Screenshots</span>
            </DialogTitle>
          </div>

          <div class="space-y-4">
            <p class="text-sm text-muted-foreground">
              Upload one or more screenshots of your Tiny Tower resident list. We'll OCR the images
              and extract resident names + dream jobs.
            </p>

            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                class="w-full sm:w-auto"
                :disabled="!allStores"
                @click="triggerScreenshotPicker"
              >
                Choose Screenshots
              </Button>
              <div class="text-sm text-muted-foreground">
                {{ selectedScreenshotCountText }}
              </div>
            </div>

            <div v-if="importProgressText" class="text-sm text-muted-foreground">
              {{ importProgressText }}
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <Button class="w-full sm:w-auto" :disabled="!canRunOcr" @click="runScreenshotOcr">
                Run OCR
              </Button>
              <Button
                variant="ghost"
                class="w-full sm:w-auto"
                :disabled="isImporting"
                @click="resetScreenshotImport"
              >
                Reset
              </Button>
            </div>

            <div v-if="importCandidates.length > 0" class="space-y-3">
              <div class="rounded-md bg-muted p-3">
                <div
                  class="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    Found <span class="font-medium">{{ importCandidates.length }}</span> residents.
                    Selected <span class="font-medium">{{ selectedImportCount }}</span
                    >.
                  </div>
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" @click="selectAllMatched"
                      >Select matched</Button
                    >
                    <Button variant="outline" size="sm" @click="selectNone">Select none</Button>
                  </div>
                </div>
              </div>

              <div class="max-h-[320px] overflow-auto rounded-md border">
                <div
                  v-for="(c, idx) in importCandidates"
                  :key="idx"
                  class="flex items-start gap-3 border-b p-3 last:border-b-0"
                >
                  <input
                    v-model="c.selected"
                    type="checkbox"
                    class="mt-1 h-4 w-4"
                    :disabled="!c.name || !c.dreamJobStoreId"
                    :aria-label="`Select ${c.name}`"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-medium">{{ c.name || c.nameRaw }}</span>
                      <span class="text-xs text-muted-foreground">({{ c.sourceFileName }})</span>
                    </div>
                    <div class="text-sm">
                      <span class="text-muted-foreground">Dream job:</span>
                      <span class="ml-1 font-medium">
                        {{ c.matchedStoreName ?? c.dreamJobRaw }}
                      </span>
                      <span class="ml-2 text-xs text-muted-foreground">
                        {{ Math.round(c.matchConfidence * 100) }}%
                      </span>
                    </div>
                    <div v-if="c.currentJobRaw || c.currentJobStoreId" class="text-sm">
                      <span class="text-muted-foreground">Current job:</span>
                      <span class="ml-1 font-medium">
                        {{ c.matchedCurrentStoreName ?? c.currentJobRaw ?? 'Unknown' }}
                      </span>
                      <span
                        v-if="c.currentMatchConfidence !== undefined"
                        class="ml-2 text-xs text-muted-foreground"
                      >
                        {{ Math.round(c.currentMatchConfidence * 100) }}%
                      </span>
                    </div>
                    <div v-if="c.issues.length > 0" class="mt-1 text-xs text-destructive">
                      {{ c.issues[0] }}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                class="w-full"
                :disabled="selectedImportCount === 0 || isImporting"
                @click="importSelectedResidents"
              >
                Import {{ selectedImportCount }} Residents
              </Button>
            </div>

            <div
              v-else-if="hasChosenScreenshots && !isImporting"
              class="text-sm text-muted-foreground"
            >
              Ready to run OCR.
            </div>

            <div v-if="!allStores" class="text-sm text-muted-foreground">
              Store data is still loading. Please wait.
            </div>
          </div>

          <input
            ref="screenshotInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleScreenshotFiles"
          />
        </DialogContent>
      </Dialog>

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

      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button variant="outline" class="w-full sm:w-auto" @click="showImportDialog = true">
          Import Screenshots
        </Button>
        <Button class="w-full sm:w-auto" @click="showAddDialog = true">
          <span class="sm:hidden">Add</span>
          <span class="hidden sm:inline">Add Resident</span>
        </Button>
      </div>
    </div>

    <EmptyState
      v-if="residents.length === 0"
      title="👋 No Residents Yet"
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
        :current-store="residentsStore.getCurrentStore(resident.id)"
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
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { APP_CONSTANTS } from '@/constants'
import { useStoresQuery, useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store, UserStore } from '@/types'
import {
  extractResidentsFromScreenshots,
  type ScreenshotResidentCandidate,
} from '@/utils/residentScreenshotImport'
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

const screenshotInput = ref<HTMLInputElement | null>(null)
const screenshotFiles = ref<File[]>([])
const importCandidates = ref<ScreenshotResidentCandidate[]>([])
const isImporting = ref(false)
const importProgressText = ref<string>('')

const hasChosenScreenshots = computed(() => screenshotFiles.value.length > 0)
const selectedScreenshotCountText = computed(() => {
  if (!hasChosenScreenshots.value) return 'No screenshots selected'
  return `${screenshotFiles.value.length} screenshot${screenshotFiles.value.length === 1 ? '' : 's'} selected`
})

const selectedImportCount = computed(() => importCandidates.value.filter(c => c.selected).length)

const canRunOcr = computed(() => {
  return Boolean(allStores.value) && hasChosenScreenshots.value && !isImporting.value
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
        nameInput.value?.focus()
      }
    }, 100)
  }
}

function handleImportDialogOpenChange(isOpen: boolean) {
  showImportDialog.value = isOpen
  if (!isOpen) {
    importProgressText.value = ''
  }
}

function triggerScreenshotPicker() {
  screenshotInput.value?.click()
}

function handleScreenshotFiles(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  screenshotFiles.value = files
  importCandidates.value = []
  importProgressText.value = ''

  // Reset input so selecting the same files again re-triggers change
  target.value = ''
}

function resetScreenshotImport() {
  if (isImporting.value) return
  screenshotFiles.value = []
  importCandidates.value = []
  importProgressText.value = ''
}

function selectAllMatched() {
  for (const c of importCandidates.value) {
    c.selected = Boolean(c.name) && Boolean(c.dreamJobStoreId)
  }
}

function selectNone() {
  for (const c of importCandidates.value) {
    c.selected = false
  }
}

async function runScreenshotOcr() {
  if (!allStores.value || screenshotFiles.value.length === 0) {
    return
  }

  isImporting.value = true
  importProgressText.value = 'Starting OCR…'
  importCandidates.value = []

  try {
    const candidates = await extractResidentsFromScreenshots({
      files: screenshotFiles.value,
      stores: allStores.value,
      onProgress: info => {
        if (info.phase === 'loading') {
          importProgressText.value = 'Loading OCR engine…'
          return
        }
        const pct = info.progress !== undefined ? ` (${Math.round(info.progress * 100)}%)` : ''
        importProgressText.value = `Recognizing ${info.fileName ?? 'image'}${pct}…`
      },
    })

    importCandidates.value = candidates
    importProgressText.value = `Done. Found ${candidates.length} residents.`

    if (candidates.length === 0) {
      toast.info('No residents detected. Try a clearer screenshot.')
    }
  } catch (error) {
    console.error('Screenshot OCR failed:', error)
    toast.error('Failed to read screenshots')
    importProgressText.value = ''
  } finally {
    isImporting.value = false
  }
}

function getStoreName(storeId: string): string {
  return allStores.value?.find(s => s.id === storeId)?.name ?? storeId
}

function buildScreenshotImportPreview(selected: ScreenshotResidentCandidate[]): {
  residentCount: number
  storesToAdd: string[]
  storesToAddNames: string[]
  currentJobPlacementsPlanned: number
  currentJobPlacementsWillSucceed: number
  currentJobPlacementsSkipped: number
} {
  const existingStoreIds = new Set(userStores.value.map(us => us.storeId))
  const storeCounts = new Map<string, number>()

  for (const us of userStores.value) {
    storeCounts.set(us.storeId, us.residents.length)
  }

  const storesToAdd = new Set<string>()

  let currentJobPlacementsPlanned = 0
  let currentJobPlacementsWillSucceed = 0
  let currentJobPlacementsSkipped = 0

  for (const c of selected) {
    if (!c.currentJobStoreId) continue
    currentJobPlacementsPlanned++

    const storeId = c.currentJobStoreId
    if (!existingStoreIds.has(storeId)) {
      existingStoreIds.add(storeId)
      storesToAdd.add(storeId)
      storeCounts.set(storeId, 0)
    }

    const currentCount = storeCounts.get(storeId) ?? 0
    if (currentCount >= APP_CONSTANTS.MAX_STORE_CAPACITY) {
      currentJobPlacementsSkipped++
      continue
    }

    currentJobPlacementsWillSucceed++
    storeCounts.set(storeId, currentCount + 1)
  }

  const storesToAddList = Array.from(storesToAdd)
  const storesToAddNames = storesToAddList.map(getStoreName)

  return {
    residentCount: selected.length,
    storesToAdd: storesToAddList,
    storesToAddNames,
    currentJobPlacementsPlanned,
    currentJobPlacementsWillSucceed,
    currentJobPlacementsSkipped,
  }
}

function buildScreenshotImportDetailLines(selected: ScreenshotResidentCandidate[]): string[] {
  const maxLines = 10

  const existingStoreIds = new Set(userStores.value.map(us => us.storeId))
  const storeCounts = new Map<string, number>()
  for (const us of userStores.value) {
    storeCounts.set(us.storeId, us.residents.length)
  }

  const lines: string[] = []
  const limited = selected.slice(0, maxLines)

  for (const c of limited) {
    const name = c.name || c.nameRaw || 'Unknown'
    const dream = c.dreamJobStoreId
      ? getStoreName(c.dreamJobStoreId)
      : (c.matchedStoreName ?? c.dreamJobRaw)
    const dreamText = dream ? `Dream: ${dream}` : 'Dream: (unknown)'

    if (!c.currentJobStoreId) {
      lines.push(`- ${name} → ${dreamText} | Current: (not detected)`)
      continue
    }

    const storeId = c.currentJobStoreId
    const currentStoreName = getStoreName(storeId)
    const willAddStore = !existingStoreIds.has(storeId)
    if (willAddStore) {
      existingStoreIds.add(storeId)
      storeCounts.set(storeId, 0)
    }

    const currentCount = storeCounts.get(storeId) ?? 0
    const full = currentCount >= APP_CONSTANTS.MAX_STORE_CAPACITY
    const placementNote = full ? 'skip (store full)' : 'place'

    if (!full) {
      storeCounts.set(storeId, currentCount + 1)
    }

    const addNote = willAddStore ? ' + add store' : ''
    lines.push(
      `- ${name} → ${dreamText} | Current: ${currentStoreName} (${placementNote}${addNote})`
    )
  }

  if (selected.length > maxLines) {
    lines.push(`…and ${selected.length - maxLines} more`)
  }

  return lines
}

function performScreenshotImport(selected: ScreenshotResidentCandidate[]) {
  let successCount = 0
  let failCount = 0
  const firstErrorMessages: string[] = []

  for (const c of selected) {
    if (!c.name || !c.dreamJobStoreId) {
      failCount++
      continue
    }

    const result = residentsStore.addResidentWithId(c.name, c.dreamJobStoreId)
    if (result.success && result.id) {
      successCount++

      if (c.currentJobStoreId) {
        storesStore.addStore(c.currentJobStoreId)
        storesStore.addResidentToStore(c.currentJobStoreId, result.id)
      }
    } else {
      failCount++
      if (result.error && firstErrorMessages.length < 2) {
        firstErrorMessages.push(`${c.name}: ${result.error}`)
      }
    }
  }

  if (successCount > 0) {
    toast.success(`Imported ${successCount} resident${successCount === 1 ? '' : 's'}`)
  }

  if (failCount > 0) {
    const extra = firstErrorMessages.length > 0 ? ` (${firstErrorMessages.join(' • ')})` : ''
    toast.error(`Failed to import ${failCount}${extra}`)
  }

  const importedNames = new Set(selected.filter(c => c.name && c.dreamJobStoreId).map(c => c.name))
  for (const c of importCandidates.value) {
    if (importedNames.has(c.name)) {
      c.selected = false
    }
  }
}

function importSelectedResidents() {
  const selected = importCandidates.value.filter(c => c.selected)
  if (selected.length === 0) return

  const preview = buildScreenshotImportPreview(selected)
  const storesToAddText =
    preview.storesToAddNames.length === 0
      ? 'None'
      : preview.storesToAddNames.length <= 6
        ? preview.storesToAddNames.join(', ')
        : `${preview.storesToAddNames.slice(0, 6).join(', ')}…`

  const messageLines = [
    `Residents to import: ${preview.residentCount}`,
    `Current-job stores to add: ${storesToAddText}`,
    `Current-job placements: ${preview.currentJobPlacementsWillSucceed}/${preview.currentJobPlacementsPlanned}`,
  ]

  if (preview.currentJobPlacementsSkipped > 0) {
    messageLines.push(`Placements skipped (store full): ${preview.currentJobPlacementsSkipped}`)
  }

  const details = buildScreenshotImportDetailLines(selected)
  if (details.length > 0) {
    messageLines.push('')
    messageLines.push('Preview:')
    messageLines.push(...details)
  }

  confirm({
    title: 'Apply screenshot import changes?',
    message: messageLines.join('\n'),
    confirmText: `Import ${preview.residentCount}`,
    onConfirm: () => performScreenshotImport(selected),
  })
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
      toast.success(`✓ Added ${newResidentName.value} (wants ${dreamJobStore?.name})`)
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
    toast.success(`✨ Placed ${resident.name} in their dream job: ${store?.name}`)
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
