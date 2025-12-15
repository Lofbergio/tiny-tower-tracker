<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="[
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'
    ]"
  />
</template>

<script setup lang="ts">
import { Separator } from 'radix-vue'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
})
</script>
