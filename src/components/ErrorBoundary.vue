<template>
  <div v-if="error" class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight text-destructive">
          Something went wrong
        </h3>
      </div>
      <div class="space-y-4 p-6 pt-0">
        <p class="text-sm text-muted-foreground">
          The application encountered an unexpected error. Your data should be safe, but you may
          need to refresh the page.
        </p>
        <details class="rounded-md bg-muted p-3">
          <summary class="cursor-pointer text-sm font-medium">Error details</summary>
          <pre class="mt-2 overflow-auto text-xs text-muted-foreground">{{ error.message }}</pre>
        </details>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button class="flex-1" @click="handleReset">Reload Application</Button>
          <Button variant="outline" class="flex-1" @click="handleExport">Export Data</Button>
        </div>
      </div>
    </Card>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores'
import { exportUserData } from '@/utils/storage'
import { onErrorCaptured, ref } from 'vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  console.error('Error caught by boundary:', err)
  error.value = err
  return false
})

function handleReset() {
  error.value = null
  window.location.reload()
}

function handleExport() {
  try {
    const appStore = useAppStore()
    exportUserData(appStore.data)
  } catch (err) {
    console.error('Failed to export data:', err)
    alert('Failed to export data. Please try copying your data from browser DevTools.')
  }
}
</script>
