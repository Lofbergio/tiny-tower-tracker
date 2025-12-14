<template>
  <input
    ref="inputEl"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue?: string
  placeholder?: string
  type?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}

const inputEl = ref<HTMLInputElement | null>(null)
defineExpose({
  focus: () => inputEl.value?.focus(),
  blur: () => inputEl.value?.blur(),
})
</script>
