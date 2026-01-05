<template>
  <SelectRoot
    :open="open"
    :model-value="modelValue"
    @update:open="handleOpenChange"
    @update:model-value="handleValueChange"
  >
    <SelectTrigger
      ref="triggerEl"
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    >
      <!-- Custom display that doesn't rely on SelectItem being in DOM -->
      <span :class="selectedItem ? '' : 'text-muted-foreground'">
        {{ selectedItem?.label ?? placeholder }}
      </span>
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
        class="z-50 w-[var(--radix-select-trigger-width)] min-w-[12rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
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
            <RadixSelectItem
              v-for="item in visibleItems"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled"
              class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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
  SelectItem as RadixSelectItem,
  SelectContent,
  SelectIcon,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from 'radix-vue'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import Input from './Input.vue'

export type SearchableSelectItem = {
  value: string
  label: string
  disabled?: boolean
}

const {
  modelValue,
  placeholder = 'Select…',
  items,
  searchPlaceholder = 'Type to filter…',
  maxItems: maxItemsProp = 25,
  requireSearchThreshold = 40,
  minQueryLength: minQueryLengthProp = 1,
  clearOnClose = true,
  debounceMs = 150,
} = defineProps<{
  modelValue?: string
  placeholder?: string
  items: SearchableSelectItem[]
  searchPlaceholder?: string
  maxItems?: number
  requireSearchThreshold?: number
  minQueryLength?: number
  clearOnClose?: boolean
  debounceMs?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const query = ref('')
const debouncedQuery = ref('')
const open = ref(false)
const searchInput = ref<{ focus?: () => void; blur?: () => void } | null>(null)
const triggerEl = ref<HTMLElement | null>(null)

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
      Math.max(0, debounceMs)
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
  return items.map(item => ({
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
  if (!q) return items

  return itemsIndex.value.filter(x => x.lower.includes(q)).map(x => x.item)
})

const maxItems = computed(() => Math.max(1, maxItemsProp))
const minQueryLength = computed(() => Math.max(0, minQueryLengthProp))
const isSearchRequired = computed(() => items.length > requireSearchThreshold)

// Always include the currently selected item so Radix can display it
const selectedItem = computed(() => {
  if (!modelValue) return null
  return items.find(item => item.value === modelValue) ?? null
})

const visibleItems = computed(() => {
  const visible = filteredItems.value.slice(0, maxItems.value)
  // Ensure selected item is always in the list for Radix to display it
  const selected = selectedItem.value
  if (selected && !visible.some(item => item.value === selected.value)) {
    return [selected, ...visible]
  }
  return visible
})

// Detect if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function handleOpenChange(isOpen: boolean) {
  open.value = isOpen
}

async function openMenu() {
  open.value = true
  await nextTick()
  // If the menu is already open, radix may keep focus elsewhere; ensure the search is ready on desktop.
  if (!isMobile()) {
    searchInput.value?.focus?.()
  }
}

function closeMenu() {
  open.value = false
}

function focusTrigger() {
  triggerEl.value?.focus()
}

function handleValueChange(value: string) {
  emit('update:modelValue', value)
  // On mobile, blur the input after selection to close keyboard
  if (isMobile()) {
    searchInput.value?.blur?.()
  }
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
    if (clearOnClose) {
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

defineExpose({
  openMenu,
  closeMenu,
  focusTrigger,
})
</script>
