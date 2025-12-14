<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 bg-black/50" />
    <DialogContent
      v-bind="$attrs"
      :disable-outside-pointer-events="false"
      class="bg-background fixed left-[50%] top-[50%] grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:w-full sm:p-6"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>

<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal } from 'radix-vue'
</script>