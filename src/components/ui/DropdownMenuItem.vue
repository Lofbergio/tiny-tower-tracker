<template>
  <DropdownMenuItem
    :class="[
      'pressable relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-[transform,background-color,color,opacity] duration-200 ease-out focus:bg-accent focus:text-accent-foreground active:scale-[0.99] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      { 'text-destructive focus:text-destructive': variant === 'destructive' },
    ]"
    :disabled="disabled"
    @select="handleSelect"
  >
    <slot />
  </DropdownMenuItem>
</template>

<script setup lang="ts">
import { DropdownMenuItem } from 'radix-vue'

const { disabled = false, variant = 'default' } = defineProps<{
  disabled?: boolean
  variant?: 'default' | 'destructive'
}>()

const emit = defineEmits<{
  select: [event: Event]
}>()

function handleSelect(event: Event) {
  emit('select', event)
}
</script>
