<template>
  <TabsList
    :orientation="orientation"
    :class="[
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      orientation === 'vertical' && 'h-auto flex-col',
    ]"
  >
    <slot />
  </TabsList>
</template>

<script setup lang="ts">
import { TabsList } from 'radix-vue'

defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>()
</script>
