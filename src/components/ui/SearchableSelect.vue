<template>
  <SelectRoot
    :open="open"
    :model-value="modelValue"
    @update:open="open = $event"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <SelectTrigger
      class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon class="h-4 w-4 opacity-50">
        <ChevronDownIcon />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        update-position-strategy="optimized"
        :avoid-collisions="false"
        class="bg-popover text-popover-foreground relative w-[var(--radix-select-trigger-width)] min-w-[12rem] overflow-hidden rounded-md border shadow-md"
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
          <p class="text-muted-foreground mt-2 text-xs">
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
            <div class="text-muted-foreground px-2 py-6 text-center text-sm">
              Start typing to see results
            </div>
          </template>
          <template v-else>
            <RadixSelectItem
              v-for="item in visibleItems"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled"
              class="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <SelectItemText>
                {{ item.label }}
              </SelectItemText>
            </RadixSelectItem>
          </template>

          <div
            v-if="
              !isSearchRequired || query.trim().length >= minQueryLength
                ? filteredItems.length === 0
                : false
            "
            class="text-muted-foreground px-2 py-6 text-center text-sm"
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
  SelectItem as RadixSelectItem,
  SelectContent,
  SelectIcon,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import Input from './Input.vue'

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
    debounceMs?: number
  }>(),
  {
    placeholder: 'Select…',
    searchPlaceholder: 'Type to filter…',
    maxItems: 25,
    requireSearchThreshold: 40,
    minQueryLength: 1,
    clearOnClose: true,
    debounceMs: 150,
  }
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const query = ref('')
const debouncedQuery = ref('')
const open = ref(false)
const searchInput = ref<{ focus?: () => void } | null>(null)

let debounceTimer: number | undefined
watch(
  query,
  value => {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(
      () => {
        debouncedQuery.value = value
      },
      Math.max(0, props.debounceMs)
    )
  },
  { flush: 'sync' }
)

watch(
  open,
  isOpen => {
    // Keep list stable while closed; also ensures first open shows all items when query empty.
    if (isOpen) {
      debouncedQuery.value = query.value
    }
  },
  { flush: 'sync' }
)

const itemsIndex = computed(() => {
  return props.items.map(item => ({
    item,
    lower: item.label.toLowerCase(),
  }))
})

const filteredItems = computed(() => {
  const qRaw = debouncedQuery.value
  if (isSearchRequired.value && qRaw.trim().length < minQueryLength.value) {
    return []
  }
  const q = qRaw.trim().toLowerCase()
  if (!q) return props.items

  return itemsIndex.value.filter(x => x.lower.includes(q)).map(x => x.item)
})

const maxItems = computed(() => Math.max(1, props.maxItems))
const minQueryLength = computed(() => Math.max(0, props.minQueryLength))
const isSearchRequired = computed(() => props.items.length > props.requireSearchThreshold)

const visibleItems = computed(() => {
  return filteredItems.value.slice(0, maxItems.value)
})

// Detect if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

watch(
  open,
  async isOpen => {
    if (isOpen) {
      await nextTick()
      // Don't auto-focus on mobile to avoid keyboard and focus issues
      if (!isMobile()) {
        searchInput.value?.focus?.()
      }
      return
    }
    if (props.clearOnClose) {
      query.value = ''
    }
  },
  { flush: 'post' }
)

// Clean up timer on unmount to prevent memory leaks
onUnmounted(() => {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }
})
</script>
