<template>
  <SelectItem
    :value="value"
    :disabled="disabled"
    class="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  >
    <slot />
  </SelectItem>
</template>

<script setup lang="ts">
import { SelectItem } from 'radix-vue'

defineProps<{
  value: string
  disabled?: boolean
}>()
</script>
