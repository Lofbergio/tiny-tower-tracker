<template>
  <SelectRoot
    :open="open"
    :model-value="modelValue"
    @update:open="open = $event"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <SelectTrigger
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon class="h-4 w-4 opacity-50">
        <ChevronDownIcon />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        class="relative w-[var(--radix-select-trigger-width)] min-w-[12rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
      >
        <div class="border-b p-2">
          <Input
            ref="searchInput"
            v-model="query"
            :placeholder="searchPlaceholder"
            class="h-9"
            @keydown.stop
            @keydown.enter.prevent
          />
          <p class="mt-2 text-xs text-muted-foreground">
            <template v-if="isSearchRequired && query.trim().length < minQueryLength">
              Type {{ minQueryLength }}+ character<span v-if="minQueryLength > 1">s</span> to search
              ({{ items.length }} options)
            </template>
            <template v-else>
              Showing {{ visibleItems.length }} of {{ filteredItems.length }}
              <span v-if="filteredItems.length > maxItems">(refine search to see more)</span>
            </template>
          </p>
        </div>

        <SelectViewport class="max-h-72 p-1">
          <template v-if="isSearchRequired && query.trim().length < minQueryLength">
            <div class="px-2 py-6 text-center text-sm text-muted-foreground">
              Start typing to see results
            </div>
          </template>
          <template v-else>
            <SelectItem
              v-for="item in visibleItems"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled"
            >
              {{ item.label }}
            </SelectItem>
          </template>

          <div
            v-if="
              !isSearchRequired || query.trim().length >= minQueryLength
                ? filteredItems.length === 0
                : false
            "
            class="px-2 py-6 text-center text-sm text-muted-foreground"
          >
            No matches
          </div>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@radix-icons/vue'
import {
  SelectContent,
  SelectIcon,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue'
import { computed, nextTick, ref, watch } from 'vue'
import Input from './Input.vue'
import SelectItem from './SelectItem.vue'

export type SearchableSelectItem = {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    items: SearchableSelectItem[]
    searchPlaceholder?: string
    maxItems?: number
    requireSearchThreshold?: number
    minQueryLength?: number
    clearOnClose?: boolean
  }>(),
  {
    placeholder: 'Select…',
    searchPlaceholder: 'Type to filter…',
    maxItems: 50,
    requireSearchThreshold: 40,
    minQueryLength: 1,
    clearOnClose: true,
  }
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const query = ref('')
const open = ref(false)
const searchInput = ref<{ focus?: () => void } | null>(null)

const filteredItems = computed(() => {
  if (isSearchRequired.value && query.value.trim().length < minQueryLength.value) {
    return []
  }
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(item => item.label.toLowerCase().includes(q))
})

const maxItems = computed(() => Math.max(1, props.maxItems))
const minQueryLength = computed(() => Math.max(0, props.minQueryLength))
const isSearchRequired = computed(() => props.items.length > props.requireSearchThreshold)

const visibleItems = computed(() => {
  return filteredItems.value.slice(0, maxItems.value)
})

watch(
  open,
  async isOpen => {
    if (isOpen) {
      await nextTick()
      searchInput.value?.focus?.()
      return
    }
    if (props.clearOnClose) {
      query.value = ''
    }
  },
  { flush: 'post' }
)
</script>
