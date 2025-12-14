<template>
  <Card>
    <div class="flex flex-col space-y-1.5 p-6">
      <h3 class="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
        <span>💾</span>
        Data Management
      </h3>
      <p class="text-muted-foreground text-sm">
        Export your data for backup or import from a previous backup
      </p>
    </div>
    <div class="space-y-4 p-6 pt-0">
      <!-- Storage Info -->
      <div class="bg-muted rounded-md p-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Storage Used:</span>
          <span class="font-medium">{{ storageInfo.percentUsed.toFixed(1) }}%</span>
        </div>
        <div
          v-if="storageInfo.percentUsed > 75"
          class="mt-2 text-xs text-yellow-600 dark:text-yellow-400"
        >
          ⚠️ Storage is getting full. Consider exporting and clearing old data.
        </div>
      </div>

      <!-- Last Saved -->
      <div v-if="appStore.lastSaved" class="text-muted-foreground text-sm">
        Last saved: {{ formatDate(appStore.lastSaved) }}
      </div>

      <!-- Actions -->
      <div class="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" class="w-full min-h-[48px]" @click="handleExport">
          <svg
            class="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export Data
        </Button>
        <Button variant="outline" class="w-full min-h-[48px]" @click="triggerImport">
          <svg
            class="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import Data
        </Button>
      </div>

      <div class="border-t pt-4">
        <Button variant="destructive" class="w-full min-h-[48px]" @click="handleClearAll">
          Clear All Data
        </Button>
        <p class="text-muted-foreground mt-2 text-xs">
          Warning: This will permanently delete all your stores, residents, and missions.
        </p>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        class="hidden"
        @change="handleImport"
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
  </Card>
</template>

<script setup lang="ts">
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
const fileInput = ref<HTMLInputElement | null>(null)
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

const storageInfo = computed(() => checkLocalStorageQuota())

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
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

    confirmDialogData.value = {
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
    }
    showConfirmDialog.value = true
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
  confirmDialogData.value = {
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
  }
  showConfirmDialog.value = true
}
</script>
