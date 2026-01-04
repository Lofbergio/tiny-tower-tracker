import type { Store } from '@/types'
import {
  extractResidentsFromScreenshots,
  type ScreenshotResidentCandidate,
} from '@/utils/residentScreenshotImport'
import type { OcrPage } from '@/utils/residentScreenshotImport/types'
import { useToast } from '@/utils/toast'
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export function useScreenshotResidentImport(options: {
  open: Ref<boolean>
  stores: Ref<Store[] | undefined>
  toast: ReturnType<typeof useToast>
}) {
  const screenshotInput = ref<HTMLInputElement | null>(null)
  const screenshotFiles = ref<File[]>([])
  const importCandidates = ref<ScreenshotResidentCandidate[]>([])
  const isImporting = ref(false)
  const importProgressText = ref<string>('')
  const isDragOver = ref(false)
  const ocrFileProgress = ref<number | null>(null)
  const ocrFileIndex = ref<number | null>(null)
  const ocrFileCount = ref<number | null>(null)
  const lastOcrPages = ref<OcrPage[]>([])

  const ocrPageByFileName = computed(() => {
    const map = new Map<string, OcrPage>()
    for (const page of lastOcrPages.value) {
      map.set(page.fileName, page)
    }
    return map
  })

  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const hasChosenScreenshots = computed(() => screenshotFiles.value.length > 0)
  const selectedScreenshotCountText = computed(() => {
    if (!hasChosenScreenshots.value) return 'No screenshots selected'
    return `${screenshotFiles.value.length} screenshot${screenshotFiles.value.length === 1 ? '' : 's'} selected`
  })

  const selectedImportCount = computed(() => importCandidates.value.filter(c => c.selected).length)
  const showImportSourceFile = computed(() => screenshotFiles.value.length > 1)

  const canRunOcr = computed(() => {
    if (!options.stores.value || !hasChosenScreenshots.value || isImporting.value) return false
    return isOnline.value
  })

  const importStatusText = computed(() => {
    if (!options.stores.value) return 'Store data is still loading. Please wait.'
    if (importProgressText.value) return importProgressText.value
    if (hasChosenScreenshots.value && !isImporting.value && importCandidates.value.length === 0) {
      return 'Ready to run OCR.'
    }
    return ''
  })

  const importStatusKey = computed(() => {
    if (!options.stores.value) return 'loading-stores'
    if (isImporting.value) return 'importing'
    if (importCandidates.value.length > 0) return 'results'
    if (hasChosenScreenshots.value) return 'ready'
    return 'idle'
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
    lastOcrPages.value = []
  }

  function handleScreenshotDrop(event: DragEvent) {
    isDragOver.value = false
    const files = Array.from(event.dataTransfer?.files ?? [])
    appendScreenshotFiles(files)
  }

  function handlePaste(event: ClipboardEvent) {
    if (!options.open.value) return

    const items = Array.from(event.clipboardData?.items ?? [])
    const imageFiles = items
      .filter(i => i.kind === 'file' && i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter((f): f is File => Boolean(f))

    if (imageFiles.length === 0) return
    event.preventDefault()
    appendScreenshotFiles(imageFiles)
    options.toast.success(
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
    lastOcrPages.value = []
  }

  async function copyOcrFixtureToClipboard(fileName: string) {
    const page = ocrPageByFileName.value.get(fileName)
    if (!page) {
      options.toast.error('No OCR fixture found for that file yet')
      return
    }

    const payload = {
      text: page.text ?? '',
      lines: page.lines ?? [],
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      options.toast.success(`Copied OCR JSON for ${fileName}`)
    } catch {
      options.toast.error('Could not copy OCR JSON to clipboard')
    }
  }

  function selectAllMatched() {
    for (const c of importCandidates.value) {
      c.selected = Boolean(c.name) && Boolean(c.dreamJobStoreId) && c.matchConfidence >= 0.75
    }
  }

  function selectNone() {
    for (const c of importCandidates.value) {
      c.selected = false
    }
  }

  function setCandidateSelected(index: number, selected: boolean) {
    const c = importCandidates.value[index]
    if (!c) return
    c.selected = selected
  }

  async function runScreenshotOcr() {
    if (!options.stores.value || screenshotFiles.value.length === 0) {
      return
    }

    isImporting.value = true
    importProgressText.value = 'Starting OCR…'
    importCandidates.value = []
    lastOcrPages.value = []
    ocrFileProgress.value = 0
    ocrFileIndex.value = 0
    ocrFileCount.value = screenshotFiles.value.length

    try {
      const candidates = await extractResidentsFromScreenshots({
        files: screenshotFiles.value,
        stores: options.stores.value,
        onOcrPage: page => {
          lastOcrPages.value.push(page)
        },
        onProgress: info => {
          const count = info.fileCount ?? screenshotFiles.value.length
          const idx = (info.fileIndex ?? 0) + 1
          const filePart = count > 1 ? ` (${idx}/${count})` : ''

          if (typeof info.fileIndex === 'number') {
            ocrFileIndex.value = info.fileIndex
          }
          if (typeof info.fileCount === 'number') {
            ocrFileCount.value = info.fileCount
          }

          if (typeof info.progress === 'number') {
            ocrFileProgress.value = info.progress
            importProgressText.value = `Processing${filePart}…`
          } else {
            ocrFileProgress.value = null
            importProgressText.value = `Running Google Vision OCR${filePart}…`
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
        options.toast.info('No residents detected. Try a clearer screenshot.')
      }
    } catch (error) {
      console.error('Screenshot OCR failed:', error)
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Failed to read screenshots'
      options.toast.error(message)
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

  watch(
    () => options.open.value,
    isOpen => {
      if (isOpen) {
        window.addEventListener('paste', handlePaste)
      } else {
        isDragOver.value = false
        window.removeEventListener('paste', handlePaste)
        importProgressText.value = ''
      }
    }
  )

  onBeforeUnmount(() => {
    window.removeEventListener('paste', handlePaste)
    window.removeEventListener('online', handleOnlineChange)
    window.removeEventListener('offline', handleOnlineChange)
  })

  return {
    screenshotInput,
    screenshotFiles,
    importCandidates,
    isImporting,
    importProgressText,
    isDragOver,
    isOnline,
    hasChosenScreenshots,
    selectedScreenshotCountText,
    selectedImportCount,
    showImportSourceFile,
    canRunOcr,
    importStatusText,
    importStatusKey,
    overallOcrProgress,
    lastOcrPages,
    copyOcrFixtureToClipboard,
    triggerScreenshotPicker,
    appendScreenshotFiles,
    handleScreenshotDrop,
    handleScreenshotFiles,
    resetScreenshotImport,
    selectAllMatched,
    selectNone,
    setCandidateSelected,
    runScreenshotOcr,
  }
}
