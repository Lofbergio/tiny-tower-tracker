<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
      <div class="flex min-w-0 flex-col space-y-1.5 text-center sm:text-left">
        <DialogTitle class="flex items-center gap-2">
          <span class="text-2xl">📸</span>
          <span>Import Residents from Screenshots</span>
        </DialogTitle>
      </div>

      <div class="min-w-0 space-y-4">
        <p class="text-sm text-muted-foreground">
          Upload one or more screenshots of your Tiny Tower resident list. We'll use Google Vision
          OCR to extract resident names + dream jobs.
        </p>

        <p v-if="!isOnline" class="text-xs text-destructive">
          You're offline. Google Vision OCR requires an internet connection.
        </p>

        <div v-if="isDev" class="rounded-md border bg-muted p-3 text-xs text-muted-foreground">
          <div class="font-medium text-foreground">Dev: Fixture workflow</div>
          <div class="mt-1">Goal: add a screenshot sample once, then keep it from regressing.</div>

          <ol class="mt-2 list-decimal space-y-1 pl-4">
            <li>Choose screenshots</li>
            <li>Run OCR (sends to Google Vision)</li>
            <li>Copy the OCR JSON output for each screenshot</li>
            <li>
              Save it under <span class="font-mono">tests/fixtures/ocr/</span> as a
              <span class="font-mono">.json</span> file
            </li>
            <li>
              Run <span class="font-mono">yarn test:update</span> once to lock in the snapshot
            </li>
          </ol>

          <div class="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              :disabled="isImporting"
              @click="copyFixturesFolderPath"
            >
              Copy fixtures folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              :disabled="isImporting"
              @click="copyTestUpdateCommand"
            >
              Copy yarn test:update
            </Button>
          </div>

          <div v-if="lastOcrPages.length === 0" class="mt-2">
            Run OCR to enable the copy buttons below.
          </div>

          <div v-else class="mt-3 border-t pt-3">
            <div class="font-medium text-foreground">OCR outputs</div>
            <div class="mt-2 flex flex-col gap-2">
              <div
                v-for="page in lastOcrPages"
                :key="page.fileName"
                class="flex flex-col gap-2 rounded-md border bg-background p-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <div class="truncate text-foreground">{{ page.fileName }}</div>
                  <div class="mt-0.5 truncate">
                    Save as:
                    <span class="font-mono">{{ fixtureFilePathFor(page.fileName) }}</span>
                  </div>
                </div>

                <div class="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isImporting"
                    @click="copySuggestedFixturePath(page.fileName)"
                  >
                    Copy path
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isImporting"
                    @click="copyOcrFixtureToClipboard(page.fileName)"
                  >
                    Copy OCR JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="importCandidates.length === 0"
          class="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Button
            variant="outline"
            class="w-full sm:w-auto"
            :disabled="!stores"
            @click="triggerScreenshotPicker"
          >
            Choose Screenshots
          </Button>
          <div class="text-sm text-muted-foreground">
            {{ selectedScreenshotCountText }}
          </div>
        </div>

        <div
          v-if="importCandidates.length === 0"
          class="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
          :class="
            isDragOver
              ? 'scale-[1.01] border-primary/50 bg-muted'
              : 'hover:border-primary/30 hover:bg-muted/30'
          "
          tabindex="0"
          @click="triggerScreenshotPicker"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleScreenshotDrop"
        >
          <div class="font-medium text-foreground">Paste / drop screenshots</div>
          <div class="mt-1 sm:hidden">Tap to choose screenshots.</div>
          <div class="mt-1 hidden sm:block">
            Paste an image (Ctrl+V), drag & drop here, or click to choose.
          </div>
        </div>

        <ScreenshotImportStatus
          :status-key="importStatusKey"
          :status-text="importStatusText"
          :is-importing="isImporting"
          :overall-progress="overallOcrProgress"
          :show-skeleton="isImporting && importCandidates.length === 0"
        />

        <div class="flex flex-col gap-2 sm:flex-row">
          <Button
            v-if="importCandidates.length === 0"
            class="w-full sm:w-auto"
            :disabled="!canRunOcr"
            @click="runScreenshotOcr"
          >
            Run OCR
          </Button>
          <Button
            v-else
            variant="outline"
            class="w-full sm:w-auto"
            :disabled="isImporting"
            @click="triggerScreenshotPicker"
          >
            Change screenshots
          </Button>
          <Button
            v-if="importCandidates.length > 0"
            variant="outline"
            class="w-full sm:w-auto"
            :disabled="!canRunOcr"
            @click="runScreenshotOcr"
          >
            Run OCR again
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

        <ScreenshotImportResults
          :visible="importCandidates.length > 0"
          :candidates="importCandidates"
          :show-import-source-file="showImportSourceFile"
          :selected-count="selectedImportCount"
          :is-importing="isImporting"
          @select-all-matched="selectAllMatched"
          @select-none="selectNone"
          @set-selected="({ index, selected }) => setCandidateSelected(index, selected)"
          @import-selected="importSelectedResidents"
        />
      </div>

      <input
        :ref="setScreenshotInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleScreenshotFiles"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import ScreenshotImportResults from '@/components/residentScreenshotImport/ScreenshotImportResults.vue'
import ScreenshotImportStatus from '@/components/residentScreenshotImport/ScreenshotImportStatus.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import { useScreenshotResidentImport } from '@/composables/useScreenshotResidentImport'
import { APP_CONSTANTS } from '@/constants'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Store, UserStore } from '@/types'
import type { ScreenshotResidentCandidate } from '@/utils/residentScreenshotImport'
import { useToast } from '@/utils/toast'
import { computed, type ComponentPublicInstance } from 'vue'

type ConfirmArgs = {
  title: string
  message: string
  confirmText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

const props = defineProps<{
  open: boolean
  stores?: Store[]
  userStores: Array<UserStore & { store?: Store }>
  confirm: (_args: ConfirmArgs) => void
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useToast()
const residentsStore = useResidentsStore()
const storesStore = useStoresStore()

const {
  importCandidates,
  isImporting,
  isDragOver,
  isOnline,
  lastOcrPages,
  screenshotInput,
  copyOcrFixtureToClipboard,
  selectedScreenshotCountText,
  selectedImportCount,
  showImportSourceFile,
  canRunOcr,
  importStatusText,
  importStatusKey,
  overallOcrProgress,
  triggerScreenshotPicker,
  handleScreenshotDrop,
  handleScreenshotFiles,
  resetScreenshotImport,
  selectAllMatched,
  selectNone,
  setCandidateSelected,
  runScreenshotOcr,
} = useScreenshotResidentImport({
  open: computed(() => props.open),
  stores: computed(() => props.stores),
  toast,
})

const isDev = !!import.meta.env.VITE_SHOW_OCR_DEV_TOOLS

function setScreenshotInput(el: Element | ComponentPublicInstance | null) {
  screenshotInput.value = el as HTMLInputElement | null
}

function fixtureFilePathFor(fileName: string): string {
  const base = fileName
    .trim()
    .replace(/^.*[\\/]/, '')
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
  return `tests/fixtures/ocr/${base || 'fixture'}.json`
}

async function copyFixturesFolderPath() {
  try {
    await navigator.clipboard.writeText('tests/fixtures/ocr')
    toast.success('Copied: tests/fixtures/ocr')
  } catch {
    toast.error('Could not copy to clipboard')
  }
}

async function copyTestUpdateCommand() {
  try {
    await navigator.clipboard.writeText('yarn test:update')
    toast.success('Copied: yarn test:update')
  } catch {
    toast.error('Could not copy to clipboard')
  }
}

async function copySuggestedFixturePath(fileName: string) {
  try {
    await navigator.clipboard.writeText(fixtureFilePathFor(fileName))
    toast.success('Copied fixture path')
  } catch {
    toast.error('Could not copy to clipboard')
  }
}

function handleOpenChange(isOpen: boolean) {
  emit('update:open', isOpen)
}

const storeNameById = computed(() => {
  const map = new Map<string, string>()
  for (const store of props.stores ?? []) {
    map.set(store.id, store.name)
  }
  return map
})

function getStoreName(storeId: string): string {
  return storeNameById.value.get(storeId) ?? storeId
}

function buildScreenshotImportPreview(selected: ScreenshotResidentCandidate[]): {
  residentCount: number
  storesToAdd: string[]
  storesToAddNames: string[]
  currentJobPlacementsPlanned: number
  currentJobPlacementsWillSucceed: number
  currentJobPlacementsSkipped: number
} {
  const existingStoreIds = new Set(props.userStores.map(us => us.storeId))
  const storeCounts = new Map<string, number>()

  for (const us of props.userStores) {
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

  const existingStoreIds = new Set(props.userStores.map(us => us.storeId))
  const storeCounts = new Map<string, number>()
  for (const us of props.userStores) {
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

  return { successCount, failCount }
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

  props.confirm({
    title: 'Apply screenshot import changes?',
    message: messageLines.join('\n'),
    confirmText: `Import ${preview.residentCount}`,
    onConfirm: () => {
      const { successCount } = performScreenshotImport(selected)
      if (successCount > 0) {
        resetScreenshotImport()
        emit('update:open', false)
      }
    },
  })
}
</script>
