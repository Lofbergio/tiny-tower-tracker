<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="['shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px']"
  />
</template>

<script setup lang="ts">
import { Separator } from 'radix-vue'

const { orientation = 'horizontal', decorative = true } = defineProps<{
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}>()
</script>
