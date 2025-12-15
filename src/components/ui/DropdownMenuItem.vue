<template>
  <DropdownMenuItem
    :class="cn('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className, variant === 'destructive' && 'text-destructive focus:text-destructive')"
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
  className?: string
}

interface Emits {
  (e: 'select', event: Event): void
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: 'default',
  className: '',
})

const emit = defineEmits<Emits>()

function handleSelect(event: Event) {
  emit('select', event)
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(v => typeof v === 'string').join(' ')
}
</script>
