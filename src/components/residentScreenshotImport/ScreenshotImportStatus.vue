<template>
  <div class="space-y-3">
    <Transition
      mode="out-in"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-0.5"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div :key="statusKey" class="min-h-5 text-sm text-muted-foreground">
        <span>{{ statusText }}</span>
        <span v-if="isImporting" class="ml-1 inline-flex w-6 justify-start">
          <span class="inline-flex gap-0.5">
            <span class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" />
            <span
              class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]"
            />
            <span
              class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]"
            />
          </span>
        </span>
      </div>
    </Transition>

    <div class="h-2">
      <div v-if="overallProgress !== null" class="h-2 overflow-hidden rounded bg-muted">
        <div
          class="h-2 bg-primary transition-[width] duration-300 ease-out"
          :style="{ width: `${Math.max(0, Math.min(100, Math.round(overallProgress * 100)))}%` }"
        />
      </div>
      <div v-else-if="isImporting" class="h-2 overflow-hidden rounded bg-muted">
        <div class="h-2 w-full animate-pulse bg-primary" />
      </div>
    </div>

    <div v-if="showSkeleton" class="space-y-2">
      <div class="rounded-md border p-3">
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <Skeleton class="h-4 w-40" />
            <Skeleton class="h-4 w-20" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'

defineProps<{
  statusKey: string
  statusText: string
  isImporting: boolean
  overallProgress: number | null
  showSkeleton: boolean
}>()
</script>
