<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 bg-black/50" />
    <DialogContent
      v-bind="$attrs"
      :disable-outside-pointer-events="false"
      class="fixed left-[50%] top-[50%] grid max-h-[calc(100dvh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] touch-pan-y gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-background p-4 pr-12 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:w-full sm:p-6"
    >
      <DialogClose as-child>
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-2 top-2 z-10"
          aria-label="Close dialog"
        >
          ✕
        </Button>
      </DialogClose>
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

<script setup lang="ts">
import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from 'radix-vue'

import Button from './Button.vue'
</script>
