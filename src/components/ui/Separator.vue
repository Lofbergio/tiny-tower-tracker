<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)"
  />
</template>

<script setup lang="ts">
import { Separator } from 'radix-vue'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
  className: '',
})

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(v => typeof v === 'string').join(' ')
}
</script>
