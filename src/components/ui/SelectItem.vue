<template>
  <SelectItem
    :value="value"
    :disabled="disabled"
    class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  >
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>

<script setup lang="ts">
import { SelectItem, SelectItemText } from 'radix-vue'

defineProps<{
  value: string
  disabled?: boolean
}>()
</script>
