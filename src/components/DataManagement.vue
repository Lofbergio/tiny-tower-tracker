<template>
  <Card>
    <div class="p-4">
      <!-- Header Row -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl dark:bg-amber-900/30"
          >
            💾
          </div>
          <div>
            <h3 class="font-semibold leading-tight">Backup & Restore</h3>
            <p class="text-xs text-muted-foreground">
              <span v-if="appStore.lastSaved"
                >Saved {{ formatRelativeTime(appStore.lastSaved) }}</span
              >
              <span v-else>Export or import your data</span>
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="handleExport"> Export </Button>
          <Button variant="outline" size="sm" @click="triggerImport"> Import </Button>
        </div>
      </div>

      <!-- Expandable Details -->
      <button
        class="mt-3 flex w-full items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
        @click="showDetails = !showDetails"
      >
        <span class="text-muted-foreground">
          Storage: {{ storageInfo.percentUsed.toFixed(1) }}% used
          <span
            v-if="storageInfo.percentUsed > 75"
            class="ml-1 text-yellow-600 dark:text-yellow-400"
            >⚠️</span
          >
        </span>
        <svg
          class="h-3 w-3 text-muted-foreground transition-transform"
          :class="{ 'rotate-180': showDetails }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div v-show="showDetails" class="mt-3 space-y-3">
        <div class="rounded-md bg-muted/50 p-3 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Storage Used:</span>
            <span class="font-medium">{{ storageInfo.percentUsed.toFixed(1) }}%</span>
          </div>
          <div
            v-if="storageInfo.percentUsed > 75"
            class="mt-2 text-yellow-600 dark:text-yellow-400"
          >
            ⚠️ Storage is getting full. Consider exporting and clearing old data.
          </div>
        </div>

        <Button variant="destructive" size="sm" class="w-full" @click="handleClearAll">
          Clear All Data
        </Button>
        <p class="text-center text-[10px] text-muted-foreground">
          This will permanently delete all your stores, residents, and missions.
        </p>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      class="hidden"
      @change="handleImport"
    />

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
  </Card>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useAppStore } from '@/stores'
import {
  checkLocalStorageQuota,
  clearAllData,
  exportUserData,
  importUserData,
} from '@/utils/storage'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'
import ConfirmDialog from './ui/ConfirmDialog.vue'

const appStore = useAppStore()
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()
const fileInput = ref<HTMLInputElement | null>(null)
const showDetails = ref(false)

const storageInfo = computed(() => checkLocalStorageQuota())

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function handleExport() {
  try {
    exportUserData(appStore.data)
    toast.success('Data exported successfully!')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to export data')
  }
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  try {
    const data = await importUserData(file)

    confirm({
      title: 'Import Data',
      message:
        'This will replace all your current data with the imported data. Are you sure you want to continue?',
      variant: 'destructive',
      confirmText: 'Import',
      onConfirm: () => {
        try {
          appStore.importData(data)
          toast.success('Data imported successfully!')
        } catch (error) {
          console.error('Import failed:', error)
          toast.error('Failed to import data')
        }
      },
    })
  } catch (error) {
    console.error('Import failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to import data'
    toast.error(message)
  } finally {
    // Reset file input
    if (target) {
      target.value = ''
    }
  }
}

function handleClearAll() {
  confirm({
    title: 'Clear All Data',
    message:
      'Are you ABSOLUTELY sure you want to delete all your data? This action cannot be undone. Consider exporting your data first.',
    variant: 'destructive',
    confirmText: 'Delete Everything',
    onConfirm: () => {
      try {
        clearAllData()
        appStore.resetData()
        toast.success('All data cleared')
      } catch (error) {
        console.error('Clear failed:', error)
        toast.error('Failed to clear data')
      }
    },
  })
}
</script>
