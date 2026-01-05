<template>
  <DialogPortal>
    <Transition name="dialog-overlay">
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    </Transition>
    <Transition name="dialog-content">
      <DialogContent
        :disable-outside-pointer-events="false"
        :aria-describedby="undefined"
        :class="[
          'dialog-game fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg touch-pan-y flex-col gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-background p-4 shadow-lg sm:w-full sm:p-6',
          $attrs.class,
        ]"
      >
        <DialogClose
          aria-label="Close dialog"
          class="pressable absolute right-2 top-2 z-10 inline-flex h-10 min-h-[44px] w-10 min-w-[44px] items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <span aria-hidden="true">✕</span>
        </DialogClose>
        <slot />
      </DialogContent>
    </Transition>
  </DialogPortal>
</template>

<script setup lang="ts">
import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from 'radix-vue'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.dialog-overlay-enter-active,
.dialog-overlay-leave-active {
  transition: opacity 150ms ease;
}
.dialog-overlay-enter-from,
.dialog-overlay-leave-to {
  opacity: 0;
}

.dialog-content-enter-active,
.dialog-content-leave-active {
  transition: opacity 150ms ease;
}
.dialog-content-enter-from,
.dialog-content-leave-to {
  opacity: 0;
}
</style>
