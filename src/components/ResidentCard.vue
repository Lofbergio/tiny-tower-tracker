<template>
  <Card
    hoverable
    class="group overflow-hidden border-l-4"
    :class="[
      statusBorderColor,
      isSettled ? 'opacity-80 motion-safe:transition-opacity motion-safe:hover:opacity-100' : '',
    ]"
    :glow="!isSettled && needsPlacement && canPlaceInDreamJob ? 'warning' : false"
  >
    <div class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-4">
      <div class="flex items-center gap-3">
        <div class="relative">
          <Avatar :src="avatarUrl" :alt="displayName" size="lg" :class="avatarClass" />
          <span
            v-if="isSettled"
            class="status-dot status-dot-success absolute -bottom-0.5 -right-0.5"
          />
          <span
            v-else-if="needsPlacement && canPlaceInDreamJob"
            class="status-dot status-dot-warning absolute -bottom-0.5 -right-0.5"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <h3
              class="min-w-0 flex-1 truncate text-base font-bold leading-tight motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 md:text-lg"
            >
              {{ displayName }}
            </h3>
            <Badge
              v-if="isSettled"
              variant="success"
              class="badge-pop shrink-0 text-[10px] md:text-xs"
            >
              <span class="star-filled mr-0.5 inline-block text-[8px]">★</span>
              Dream Job
            </Badge>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y-3 p-3 pt-0 md:p-4 md:pt-0">
      <div class="grid grid-cols-2 gap-3 text-xs md:text-sm">
        <div>
          <p class="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Dream Job
          </p>
          <p class="truncate font-semibold">{{ getDreamJobName() }}</p>
        </div>
        <div>
          <p class="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Current
          </p>
          <p class="truncate font-semibold">
            {{ currentStore ? getCurrentStoreName() : 'Unassigned' }}
          </p>
        </div>
      </div>

      <!-- Status hints -->
      <p
        v-if="needsPlacement && !dreamJobStoreBuilt && dreamJobDemandCount >= 3"
        class="text-xs text-muted-foreground"
      >
        {{ dreamJobDemandCount }} residents want this store
      </p>
      <p
        v-else-if="needsPlacement && dreamJobStoreBuilt && !canPlaceInDreamJob"
        class="text-xs text-muted-foreground"
      >
        Store is full (3/3)
      </p>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <Button
          v-if="!isSettled && needsPlacement && canPlaceInDreamJob"
          variant="success"
          size="sm"
          class="w-full"
          @click="$emit('place-in-dream-job')"
        >
          Place in Dream Job
        </Button>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" class="flex-1" @click="$emit('edit-resident')">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground hover:text-foreground"
            @click="$emit('remove-resident')"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Resident, Store } from '@/types'
import { getResidentAvatarUrl } from '@/utils/avatar'
import { formatResidentName } from '@/utils/residentName'
import { computed } from 'vue'
import Avatar from './ui/Avatar.vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

const {
  resident,
  stores,
  currentStore,
  dreamJobStoreBuilt = true,
  dreamJobStoreFull = false,
  dreamJobDemandCount = 0,
} = defineProps<{
  resident: Resident
  stores: Store[]
  currentStore?: string
  dreamJobStoreBuilt?: boolean
  dreamJobStoreFull?: boolean
  dreamJobDemandCount?: number
}>()

defineEmits<{
  'remove-resident': []
  'place-in-dream-job': []
  'edit-resident': []
}>()

const isSettled = computed(() => {
  return !!currentStore && currentStore === resident.dreamJob
})

const needsPlacement = computed(() => {
  return !currentStore || currentStore !== resident.dreamJob
})

const canPlaceInDreamJob = computed(() => {
  return needsPlacement.value && dreamJobStoreBuilt && !dreamJobStoreFull
})

const statusBorderColor = computed(() => {
  if (!currentStore) {
    return 'border-gray-400 dark:border-gray-600' // Unassigned
  }
  if (currentStore === resident.dreamJob) {
    return 'border-green-500 dark:border-green-600' // In dream job
  }
  return 'border-yellow-500 dark:border-yellow-600' // Needs placement
})

const avatarClass = computed(() => {
  const border = statusBorderColor.value.replace('border-l-4', 'border-2')
  return [
    border,
    'motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:animate-jiggle',
  ]
})

const displayName = computed(() => formatResidentName(resident.name))

const storeById = computed(() => {
  const map = new Map<string, Store>()
  for (const store of stores) {
    map.set(store.id, store)
  }
  return map
})

// Generate avatar using DiceBear API
const avatarUrl = computed(() => {
  return getResidentAvatarUrl(displayName.value)
})

function getDreamJobName() {
  const store = storeById.value.get(resident.dreamJob)
  return store?.name || resident.dreamJob
}

function getCurrentStoreName() {
  const store = currentStore ? storeById.value.get(currentStore) : undefined
  return store?.name || currentStore
}
</script>
