<template>
  <Card
    class="group overflow-hidden border-l-4 transition-all hover:shadow-md"
    :class="[
      statusBorderColor,
      isSettled ? 'opacity-70 motion-safe:transition-opacity motion-safe:hover:opacity-100' : '',
    ]"
  >
    <div class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-6">
      <div class="flex items-center gap-3">
        <Avatar :src="avatarUrl" :alt="displayName" size="lg" :class="avatarClass" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <h3
              class="min-w-0 flex-1 truncate text-lg font-semibold leading-tight motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 md:text-2xl md:leading-none md:tracking-tight"
            >
              {{ displayName }}
            </h3>
            <Badge v-if="isSettled" variant="secondary" class="badge-pop shrink-0 text-xs">
              <span class="check-celebrate inline-block">✓</span> All set
            </Badge>
          </div>
        </div>
      </div>
    </div>
    <div class="p-3 pt-0 md:p-6 md:pt-0">
      <div class="space-y-1.5 md:space-y-2">
        <div>
          <p class="text-xs font-medium md:text-sm">Dream Job:</p>
          <p class="text-xs text-muted-foreground md:text-sm">{{ getDreamJobName() }}</p>
        </div>
        <div v-if="currentStore">
          <p class="text-xs font-medium md:text-sm">Current Store:</p>
          <p class="text-xs text-muted-foreground md:text-sm">{{ getCurrentStoreName() }}</p>
        </div>
        <div v-else>
          <p class="text-xs text-muted-foreground md:text-sm">Not placed in any store</p>
        </div>
        <div
          v-if="needsPlacement && !dreamJobStoreBuilt && dreamJobDemandCount >= 3"
          class="rounded bg-blue-50 p-1.5 motion-safe:animate-pop dark:bg-blue-950/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-blue-800 dark:text-blue-200 md:text-sm">
            🏗️ Build dream job store ({{ dreamJobDemandCount }}/3 want it)
          </p>
        </div>
        <div
          v-else-if="needsPlacement && canPlaceInDreamJob"
          class="rounded bg-yellow-50 p-1.5 motion-safe:animate-pop dark:bg-yellow-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200 md:text-sm">
            Needs placement in dream job store
          </p>
        </div>
        <div
          v-else-if="needsPlacement && dreamJobStoreBuilt && !canPlaceInDreamJob"
          class="rounded bg-orange-50 p-1.5 motion-safe:animate-pop dark:bg-orange-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-orange-800 dark:text-orange-200 md:text-sm">
            ⚠️ Dream job store is full (3/3)
          </p>
        </div>
      </div>

      <Separator class="my-3 md:my-4" />

      <div class="space-y-2">
        <Button
          v-if="!isSettled && needsPlacement && canPlaceInDreamJob"
          variant="default"
          size="sm"
          class="w-full"
          @click="$emit('place-in-dream-job')"
        >
          <span aria-hidden="true" class="mr-1 inline-block motion-safe:group-hover:animate-jiggle"
            >✨</span
          >
          Place in Dream Job
        </Button>
        <p v-else-if="isSettled" class="text-xs text-muted-foreground md:text-sm">
          Done — working their dream job.
        </p>

        <Button variant="outline" size="sm" class="w-full" @click="$emit('edit-resident')">
          Edit
        </Button>

        <Button
          variant="ghost"
          size="sm"
          class="w-full text-destructive hover:text-destructive"
          @click="$emit('remove-resident')"
        >
          Remove Resident
        </Button>
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
import Separator from './ui/Separator.vue'

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
