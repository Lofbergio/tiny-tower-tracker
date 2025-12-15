<template>
  <TabsTrigger
    :value="value"
    :disabled="disabled"
    class="pressable inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-background/50"
  >
    <slot />
  </TabsTrigger>
</template>

<script setup lang="ts">
import { TabsTrigger } from 'radix-vue'

defineProps<{
  value: string
  disabled?: boolean
}>()
</script>
