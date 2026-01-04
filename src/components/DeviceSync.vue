<template>
  <Card>
    <div class="flex items-center justify-between gap-4 p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xl dark:bg-blue-900/30"
        >
          📱
        </div>
        <div>
          <h3 class="font-semibold leading-tight">Device Sync</h3>
          <p class="text-xs text-muted-foreground">Transfer data between devices</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="showSendDialog = true"> Send </Button>
        <Button variant="outline" size="sm" @click="showReceiveDialog = true"> Receive </Button>
      </div>
    </div>
  </Card>

  <!-- Send Dialog -->
  <Dialog :open="showSendDialog" @update:open="showSendDialog = $event">
    <DialogContent class="max-w-md">
      <DialogTitle>Send Data to Another Device</DialogTitle>

      <div class="space-y-4 py-4">
        <!-- Data Summary -->
        <div class="rounded-md bg-muted p-3 text-sm">
          <div class="font-medium">Your data includes:</div>
          <ul class="mt-1 text-muted-foreground">
            <li>• {{ appStore.data.stores.length }} stores</li>
            <li>• {{ appStore.data.residents.length }} residents</li>
            <li>• {{ appStore.data.missions.length }} missions</li>
          </ul>
        </div>

        <!-- QR Code (best for PC → Mobile) -->
        <div class="space-y-2">
          <div class="text-sm font-medium">Option 1: Scan QR Code</div>
          <p class="text-xs text-muted-foreground">
            Best for sending from computer to phone. Open camera app and scan.
          </p>
          <div
            class="flex min-h-[200px] items-center justify-center rounded-lg border bg-white p-4"
          >
            <div v-if="qrLoading" class="text-muted-foreground">Generating QR code...</div>
            <div v-else-if="qrError" class="text-center text-sm text-red-500">
              {{ qrError }}
              <Button variant="link" size="sm" class="mt-2" @click="generateQR"> Try Again </Button>
            </div>
            <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="max-h-[200px]" />
          </div>
        </div>

        <!-- Separator -->
        <div class="flex items-center gap-2">
          <Separator class="flex-1" />
          <span class="text-xs text-muted-foreground">OR</span>
          <Separator class="flex-1" />
        </div>

        <!-- Copy Text (works everywhere) -->
        <div class="space-y-2">
          <div class="text-sm font-medium">Option 2: Copy &amp; Paste</div>
          <p class="text-xs text-muted-foreground">
            Copy the code below and paste it on the other device (via notes, messaging, etc.)
          </p>
          <div class="relative">
            <textarea
              ref="codeTextarea"
              v-model="encodedData"
              readonly
              class="h-20 w-full resize-none rounded-md border bg-muted p-2 font-mono text-xs"
              @focus="selectTextarea"
            />
            <Button
              variant="secondary"
              size="sm"
              class="absolute right-2 top-2"
              @click="copyToClipboard"
            >
              {{ copied ? '✓ Copied!' : 'Copy' }}
            </Button>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button variant="outline" @click="showSendDialog = false">Close</Button>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Receive Dialog -->
  <Dialog :open="showReceiveDialog" @update:open="showReceiveDialog = $event">
    <DialogContent class="max-w-md">
      <DialogTitle>Receive Data from Another Device</DialogTitle>

      <div class="space-y-4 py-4">
        <!-- Instructions -->
        <div class="rounded-md bg-muted p-3 text-sm">
          <div class="font-medium">How to get your sync code:</div>
          <ul class="mt-2 space-y-1 text-muted-foreground">
            <li>📱 <strong>From QR scan:</strong> Copy the text your camera shows</li>
            <li>📋 <strong>From message:</strong> Copy the code you received</li>
          </ul>
        </div>

        <textarea
          v-model="importCode"
          placeholder="Paste your sync code here..."
          class="h-32 w-full resize-none rounded-md border bg-background p-3 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <Button
          variant="outline"
          size="sm"
          class="w-full"
          :disabled="!hasClipboardAccess"
          @click="pasteFromClipboard"
        >
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Paste from Clipboard
        </Button>

        <!-- Preview -->
        <div v-if="previewData" class="rounded-md bg-muted p-3 text-sm">
          <div class="font-medium text-green-600 dark:text-green-400">✓ Valid data detected:</div>
          <ul class="mt-1 text-muted-foreground">
            <li>• {{ previewData.stores.length }} stores</li>
            <li>• {{ previewData.residents.length }} residents</li>
            <li>• {{ previewData.missions.length }} missions</li>
          </ul>
        </div>

        <div
          v-if="importError"
          class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
        >
          {{ importError }}
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showReceiveDialog = false">Cancel</Button>
        <Button :disabled="!previewData" @click="confirmImport"> Import Data </Button>
      </div>
    </DialogContent>
  </Dialog>

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
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useAppStore } from '@/stores'
import type { UserData } from '@/types'
import { decodeDataFromSync, encodeDataForSync } from '@/utils/storage'
import { useToast } from '@/utils/toast'
import QRCode from 'qrcode'
import { computed, ref, watch } from 'vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'
import ConfirmDialog from './ui/ConfirmDialog.vue'
import Dialog from './ui/Dialog.vue'
import DialogContent from './ui/DialogContent.vue'
import DialogTitle from './ui/DialogTitle.vue'
import Separator from './ui/Separator.vue'

const appStore = useAppStore()
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()

// === Send State ===
const showSendDialog = ref(false)
const qrDataUrl = ref<string | null>(null)
const qrLoading = ref(false)
const qrError = ref<string | null>(null)
const encodedData = ref('')
const copied = ref(false)
const codeTextarea = ref<HTMLTextAreaElement | null>(null)

// === Receive State ===
const showReceiveDialog = ref(false)
const importCode = ref('')
const importError = ref<string | null>(null)
const previewData = ref<UserData | null>(null)

const hasClipboardAccess = computed(() => {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator
})

// Generate QR and encoded data when send dialog opens
watch(showSendDialog, async open => {
  if (open) {
    encodedData.value = encodeDataForSync(appStore.data)
    copied.value = false
    await generateQR()
  }
})

// Validate import code as user types
watch(importCode, code => {
  importError.value = null
  previewData.value = null

  if (!code.trim()) return

  try {
    previewData.value = decodeDataFromSync(code)
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Invalid sync code'
  }
})

async function generateQR() {
  qrLoading.value = true
  qrError.value = null

  try {
    const encoded = encodeDataForSync(appStore.data)

    // QR codes have size limits - check if data fits
    // Version 40 QR code can hold ~4,296 alphanumeric chars in L error correction
    if (encoded.length > 4000) {
      qrError.value =
        'Your data is too large for a QR code. Please use the copy/paste option instead.'
      return
    }

    qrDataUrl.value = await QRCode.toDataURL(encoded, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('QR generation failed:', error)
    qrError.value = 'Failed to generate QR code. Please use the copy/paste option.'
  } finally {
    qrLoading.value = false
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(encodedData.value)
    copied.value = true
    toast.success('Copied to clipboard!')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Copy failed:', error)
    toast.error('Failed to copy. Please select and copy manually.')
  }
}

function selectTextarea(event: FocusEvent) {
  const target = event.target as HTMLTextAreaElement | null
  target?.select()
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    importCode.value = text
  } catch (error) {
    console.error('Paste failed:', error)
    toast.error('Failed to access clipboard. Please paste manually.')
  }
}

function confirmImport() {
  if (!previewData.value) return

  confirm({
    title: 'Import Data',
    message:
      'This will replace all your current data with the imported data. Are you sure you want to continue?',
    variant: 'destructive',
    confirmText: 'Import',
    onConfirm: () => {
      try {
        appStore.importData(previewData.value!)
        toast.success('Data imported successfully!')
        showReceiveDialog.value = false
        importCode.value = ''
        previewData.value = null
      } catch (error) {
        console.error('Import failed:', error)
        toast.error('Failed to import data')
      }
    },
  })
}
</script>
