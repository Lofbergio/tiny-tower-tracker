<template>
  <SelectItem
    :value="value"
    :disabled="disabled"
    class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  >
    <SelectItemIndicator class="mr-2 inline-flex h-3.5 w-3.5 items-center justify-center">
      <CheckIcon class="h-4 w-4" />
    </SelectItemIndicator>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

<script setup lang="ts">
import { CheckIcon } from '@radix-icons/vue'
import { SelectItem, SelectItemIndicator, SelectItemText } from 'radix-vue'

defineProps<{
  value: string
  disabled?: boolean
}>()
</script>
