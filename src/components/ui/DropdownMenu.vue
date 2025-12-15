<template>
  <DropdownMenuRoot v-model:open="open">
    <slot />
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { DropdownMenuRoot } from 'radix-vue'
import { ref, watch } from 'vue'

interface Props {
  modelValue?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const open = ref(props.modelValue ?? false)

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== undefined) {
      open.value = newValue
    }
  }
)

watch(open, newValue => {
  emit('update:modelValue', newValue)
})
</script>
