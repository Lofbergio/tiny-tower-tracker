<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 bg-black/50 backdrop-blur-sm duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="$attrs"
      :disable-outside-pointer-events="false"
      class="dialog-game fixed left-[50%] top-[50%] grid max-h-[calc(100dvh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] touch-pan-y gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-background p-4 pr-12 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:w-full sm:p-6"
    >
      <DialogClose
        aria-label="Close dialog"
        class="pressable absolute right-2 top-2 z-10 inline-flex h-10 min-h-[44px] w-10 min-w-[44px] items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <span aria-hidden="true">✕</span>
      </DialogClose>
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

<script setup lang="ts">
import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from 'radix-vue'
</script>
