<template>
  <DialogRoot :open="open" @update:open="handleUpdate">
    <slot />
  </DialogRoot>
</template>

<script setup lang="ts">
import { DialogRoot } from 'radix-vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function handleUpdate(value: boolean) {
  emit('update:open', value)
}
</script>
