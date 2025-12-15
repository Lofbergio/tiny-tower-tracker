<template>
  <TooltipProvider :delay-duration="delayDuration" :skip-delay-duration="skipDelayDuration">
    <slot />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { TooltipProvider } from 'radix-vue'

interface Props {
  delayDuration?: number
  skipDelayDuration?: number
}

withDefaults(defineProps<Props>(), {
  delayDuration: 200,
  skipDelayDuration: 300,
})
</script>
