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

interface Props {
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

interface Emits {
  (e: 'select', event: Event): void
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: 'default',
})

const emit = defineEmits<Emits>()

function handleSelect(event: Event) {
  emit('select', event)
}
</script>
