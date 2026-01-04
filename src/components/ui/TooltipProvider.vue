<template>
  <TooltipProvider :delay-duration="delayDuration" :skip-delay-duration="skipDelayDuration">
    <slot />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { TooltipProvider } from 'radix-vue'

const { delayDuration = 200, skipDelayDuration = 300 } = defineProps<{
  delayDuration?: number
  skipDelayDuration?: number
}>()
</script>
