<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
      <div class="flex flex-col space-y-1.5 text-center sm:text-left">
        <DialogTitle class="flex items-center gap-2">
          <span class="text-2xl">📸</span>
          <span>Import Residents from Screenshots</span>
        </DialogTitle>
      </div>

      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Upload one or more screenshots of your Tiny Tower resident list. We'll use Google Vision
          OCR to extract resident names + dream jobs.
        </p>

        <p v-if="!isOnline" class="text-xs text-destructive">
          You're offline. Google Vision OCR requires an internet connection.
        </p>

        <div
          v-if="isLikelyViteDev"
          class="rounded-md border bg-muted p-3 text-xs text-muted-foreground"
        >
          <div class="font-medium text-foreground">Local dev note</div>
          <div class="mt-1">
            You're currently on the Vite dev server (port 5173). Netlify Functions only work when
            running Netlify Dev (port 8888).
          </div>
          <div class="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              :disabled="isImporting"
              @click="copyNetlifyDevCommand"
            >
              Copy yarn dev:netlify
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              :disabled="isImporting"
              @click="openNetlifyDevUrl"
            >
              Open localhost:8888
            </Button>
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
          :class="isDragOver ? 'bg-muted' : ''"
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

        <div class="min-h-5 text-sm text-muted-foreground">
          {{ importStatusText }}
        </div>

        <div class="h-2">
          <div v-if="overallOcrProgress !== null" class="h-2 overflow-hidden rounded bg-muted">
            <div
              class="h-2 bg-primary transition-[width]"
              :style="{
                width: `${Math.max(0, Math.min(100, Math.round(overallOcrProgress * 100)))}%`,
              }"
            />
          </div>
        </div>

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

        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
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
                <div class="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full sm:w-auto"
                    @click="selectAllMatched"
                  >
                    Select matched
                  </Button>
                  <Button variant="outline" size="sm" class="w-full sm:w-auto" @click="selectNone">
                    Select none
                  </Button>
                </div>
              </div>
            </div>

            <div class="max-h-[50vh] overflow-auto rounded-md border sm:max-h-[320px]">
              <TransitionGroup
                tag="div"
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
                move-class="transition-transform duration-200"
              >
                <label
                  v-for="(c, idx) in importCandidates"
                  :key="`${c.sourceFileName}-${idx}`"
                  class="flex items-start gap-3 border-b p-4 transition-colors last:border-b-0 sm:p-3"
                  :class="
                    !c.name || !c.dreamJobStoreId
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer active:bg-muted/60'
                  "
                >
                  <div class="-m-2 p-2">
                    <input
                      v-model="c.selected"
                      type="checkbox"
                      class="mt-0.5 h-6 w-6 rounded border-input bg-background text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mt-1 sm:h-4 sm:w-4"
                      :disabled="!c.name || !c.dreamJobStoreId"
                      :aria-label="`Select ${c.name}`"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-medium">{{ c.name || c.nameRaw }}</span>
                      <span v-if="showImportSourceFile" class="text-xs text-muted-foreground"
                        >({{ c.sourceFileName }})</span
                      >
                    </div>
                    <div class="text-sm">
                      <span class="text-muted-foreground">Dream job:</span>
                      <span class="ml-1 font-medium">{{
                        c.matchedStoreName ?? c.dreamJobRaw
                      }}</span>
                    </div>
                    <div v-if="c.currentJobRaw || c.currentJobStoreId" class="text-sm">
                      <span class="text-muted-foreground">Current job:</span>
                      <span class="ml-1 font-medium">
                        {{ c.matchedCurrentStoreName ?? c.currentJobRaw ?? 'Unknown' }}
                      </span>
                    </div>
                    <div v-if="c.issues.length > 0" class="mt-1 text-xs text-destructive">
                      {{ c.issues[0] }}
                    </div>
                  </div>
                </label>
              </TransitionGroup>
            </div>

            <Button
              class="w-full"
              :disabled="selectedImportCount === 0 || isImporting"
              @click="importSelectedResidents"
            >
              Import {{ selectedImportCount }} Residents
            </Button>
          </div>
        </Transition>
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
</template>

<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import { APP_CONSTANTS } from '@/constants'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Store, UserStore } from '@/types'
import {
  extractResidentsFromScreenshots,
  type ScreenshotResidentCandidate,
} from '@/utils/residentScreenshotImport'
import { useToast } from '@/utils/toast'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

const screenshotInput = ref<HTMLInputElement | null>(null)
const screenshotFiles = ref<File[]>([])
const importCandidates = ref<ScreenshotResidentCandidate[]>([])
const isImporting = ref(false)
const importProgressText = ref<string>('')
const isDragOver = ref(false)
const ocrFileProgress = ref<number | null>(null)
const ocrFileIndex = ref<number | null>(null)
const ocrFileCount = ref<number | null>(null)

const hasChosenScreenshots = computed(() => screenshotFiles.value.length > 0)
const selectedScreenshotCountText = computed(() => {
  if (!hasChosenScreenshots.value) return 'No screenshots selected'
  return `${screenshotFiles.value.length} screenshot${screenshotFiles.value.length === 1 ? '' : 's'} selected`
})

const selectedImportCount = computed(() => importCandidates.value.filter(c => c.selected).length)
const showImportSourceFile = computed(() => screenshotFiles.value.length > 1)

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

const canRunOcr = computed(() => {
  if (!props.stores || !hasChosenScreenshots.value || isImporting.value) return false
  return isOnline.value
})

const importStatusText = computed(() => {
  if (!props.stores) return 'Store data is still loading. Please wait.'
  if (importProgressText.value) return importProgressText.value
  if (hasChosenScreenshots.value && !isImporting.value && importCandidates.value.length === 0) {
    return 'Ready to run OCR.'
  }
  return ''
})

const overallOcrProgress = computed(() => {
  if (!isImporting.value) return null
  if (ocrFileProgress.value === null) return null
  const count = ocrFileCount.value ?? screenshotFiles.value.length
  if (!count) return null
  const index = ocrFileIndex.value ?? 0
  const perFile = 1 / count
  return index * perFile + ocrFileProgress.value * perFile
})

function handleOpenChange(isOpen: boolean) {
  emit('update:open', isOpen)
  if (!isOpen) {
    importProgressText.value = ''
  }
}

watch(
  () => props.open,
  (isOpen: boolean) => {
    if (isOpen) {
      window.addEventListener('paste', handlePaste)
    } else {
      isDragOver.value = false
      window.removeEventListener('paste', handlePaste)
    }
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  window.removeEventListener('online', handleOnlineChange)
  window.removeEventListener('offline', handleOnlineChange)
})

function triggerScreenshotPicker() {
  screenshotInput.value?.click()
}

function appendScreenshotFiles(files: File[]) {
  const incoming = files.filter(f => f.type.startsWith('image/'))
  if (incoming.length === 0) return

  const existingKeys = new Set(
    screenshotFiles.value.map(f => `${f.name}|${f.size}|${f.lastModified}`)
  )
  const unique = incoming.filter(f => !existingKeys.has(`${f.name}|${f.size}|${f.lastModified}`))
  if (unique.length === 0) return

  screenshotFiles.value = [...screenshotFiles.value, ...unique]
  importCandidates.value = []
  importProgressText.value = ''
}

function handleScreenshotDrop(event: DragEvent) {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  appendScreenshotFiles(files)
}

function handlePaste(event: ClipboardEvent) {
  if (!props.open) return

  const items = Array.from(event.clipboardData?.items ?? [])
  const imageFiles = items
    .filter(i => i.kind === 'file' && i.type.startsWith('image/'))
    .map(i => i.getAsFile())
    .filter((f): f is File => Boolean(f))

  if (imageFiles.length === 0) return
  event.preventDefault()
  appendScreenshotFiles(imageFiles)
  toast.success(
    `Added ${imageFiles.length} pasted image${imageFiles.length === 1 ? '' : 's'} to import`
  )
}

function handleScreenshotFiles(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  screenshotFiles.value = []
  appendScreenshotFiles(files)

  // Reset input so selecting the same files again re-triggers change
  target.value = ''
}

function resetScreenshotImport() {
  if (isImporting.value) return
  screenshotFiles.value = []
  importCandidates.value = []
  importProgressText.value = ''
  ocrFileProgress.value = null
  ocrFileIndex.value = null
  ocrFileCount.value = null
}

function selectAllMatched() {
  for (const c of importCandidates.value) {
    c.selected = Boolean(c.name) && Boolean(c.dreamJobStoreId) && c.matchConfidence >= 0.85
  }
}

function selectNone() {
  for (const c of importCandidates.value) {
    c.selected = false
  }
}

async function runScreenshotOcr() {
  if (!props.stores || screenshotFiles.value.length === 0) {
    return
  }

  isImporting.value = true
  importProgressText.value = 'Starting OCR…'
  importCandidates.value = []
  ocrFileProgress.value = 0
  ocrFileIndex.value = 0
  ocrFileCount.value = screenshotFiles.value.length

  try {
    const candidates = await extractResidentsFromScreenshots({
      files: screenshotFiles.value,
      stores: props.stores,
      onProgress: info => {
        if (info.phase === 'loading') {
          importProgressText.value = 'Loading OCR engine…'
          ocrFileProgress.value = null
          return
        }
        if (info.phase === 'cloud') {
          const count = info.fileCount ?? screenshotFiles.value.length
          const idx = (info.fileIndex ?? 0) + 1
          const filePart = count > 1 ? ` (${idx}/${count})` : ''
          importProgressText.value = `Running Google Vision OCR${filePart}…`
          if (typeof info.fileIndex === 'number') {
            ocrFileIndex.value = info.fileIndex
          }
          if (typeof info.fileCount === 'number') {
            ocrFileCount.value = info.fileCount
          }
          if (typeof info.progress === 'number') {
            ocrFileProgress.value = info.progress
          } else {
            ocrFileProgress.value = null
          }
          return
        }
      },
    })

    importCandidates.value = candidates
    selectAllMatched()
    const autoSelected = importCandidates.value.filter(c => c.selected).length
    importProgressText.value =
      candidates.length === 0
        ? 'Done. No residents found.'
        : autoSelected > 0
          ? `Done. Found ${candidates.length} residents. Auto-selected ${autoSelected}.`
          : `Done. Found ${candidates.length} residents.`
    ocrFileProgress.value = 1

    if (candidates.length === 0) {
      toast.info('No residents detected. Try a clearer screenshot.')
    }
  } catch (error) {
    console.error('Screenshot OCR failed:', error)
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to read screenshots'
    toast.error(message)
    importProgressText.value = message
    ocrFileProgress.value = null
  } finally {
    isImporting.value = false
  }
}

function handleOnlineChange() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', handleOnlineChange)
  window.addEventListener('offline', handleOnlineChange)
})

const isLikelyViteDev = computed(() => {
  const isDev = Boolean((import.meta as any)?.env?.DEV)
  if (!isDev) return false
  const port = window.location.port
  return (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    (port === '5173' || port === '4173')
  )
})

async function copyNetlifyDevCommand() {
  try {
    await navigator.clipboard.writeText('yarn dev:netlify')
    toast.success('Copied: yarn dev:netlify')
  } catch {
    toast.error('Could not copy to clipboard')
  }
}

function openNetlifyDevUrl() {
  window.open('http://localhost:8888', '_blank', 'noopener,noreferrer')
}

function getStoreName(storeId: string): string {
  return props.stores?.find(s => s.id === storeId)?.name ?? storeId
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

  props.confirm({
    title: 'Apply screenshot import changes?',
    message: messageLines.join('\n'),
    confirmText: `Import ${preview.residentCount}`,
    onConfirm: () => performScreenshotImport(selected),
  })
}
</script>
