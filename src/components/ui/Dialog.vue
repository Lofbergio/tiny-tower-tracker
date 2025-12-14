<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="$emit('update:open', false)"
    >
      <div class="fixed inset-0 bg-black/50" />
      <div :class="cn(
        'relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
        $attrs.class
      )">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  open: boolean
}

defineProps<Props>()

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

