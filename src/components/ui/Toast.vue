<template>
  <div class="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-4">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex min-w-[300px] items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
          toastClasses[toast.type],
        ]"
      >
        <div class="flex-shrink-0">
          <CheckCircledIcon v-if="toast.type === 'success'" class="h-5 w-5" />
          <ExclamationTriangleIcon v-else-if="toast.type === 'warning'" class="h-5 w-5" />
          <CrossCircledIcon v-else-if="toast.type === 'error'" class="h-5 w-5" />
          <InfoCircledIcon v-else class="h-5 w-5" />
        </div>
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          class="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-white/10"
          @click="dismissToast(toast.id)"
        >
          <Cross2Icon class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/utils/toast'
import {
  CheckCircledIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-icons/vue'

const { toasts, dismissToast } = useToast()

const toastClasses = {
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 140ms ease,
    transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
</style>
