<template>
  <Card
    class="group overflow-hidden border-l-4 transition-all hover:shadow-md"
    :class="statusBorderColor"
  >
    <div class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-6">
      <div class="flex items-center gap-3">
        <Avatar :src="avatarUrl" :alt="displayName" size="lg" :class="avatarClass" />
        <h3
          class="flex-1 text-lg font-semibold leading-tight motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 md:text-2xl md:leading-none md:tracking-tight"
        >
          {{ displayName }}
        </h3>
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
          v-if="needsPlacement && !dreamJobStoreBuilt"
          class="motion-safe:animate-pop rounded bg-blue-50 p-1.5 dark:bg-blue-950/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-blue-800 dark:text-blue-200 md:text-sm">
            🏗️ Dream job store not built yet
          </p>
        </div>
        <div
          v-else-if="needsPlacement && canPlaceInDreamJob"
          class="motion-safe:animate-pop rounded bg-yellow-50 p-1.5 dark:bg-yellow-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200 md:text-sm">
            Needs placement in dream job store
          </p>
        </div>
        <div
          v-else-if="needsPlacement && dreamJobStoreBuilt && !canPlaceInDreamJob"
          class="motion-safe:animate-pop rounded bg-orange-50 p-1.5 dark:bg-orange-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-orange-800 dark:text-orange-200 md:text-sm">
            ⚠️ Dream job store is full (3/3)
          </p>
        </div>
      </div>

      <Separator class="my-3 md:my-4" />

      <div class="space-y-2">
        <Button
          v-if="needsPlacement && canPlaceInDreamJob"
          variant="default"
          size="sm"
          class="w-full"
          @click="$emit('place-in-dream-job')"
        >
          <span aria-hidden="true" class="motion-safe:group-hover:animate-jiggle mr-1 inline-block"
            >✨</span
          >
          Place in Dream Job
        </Button>
        <Button
          v-else-if="!currentStore"
          variant="outline"
          size="sm"
          class="w-full"
          @click="$emit('assign-to-store')"
        >
          📍 Assign to Store
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
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'
import Separator from './ui/Separator.vue'

interface Props {
  resident: Resident
  stores: Store[]
  currentStore?: string
  dreamJobStoreBuilt?: boolean
  dreamJobStoreFull?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentStore: undefined,
  dreamJobStoreBuilt: true,
  dreamJobStoreFull: false,
})

defineEmits<{
  'remove-resident': []
  'place-in-dream-job': []
  'assign-to-store': []
}>()

const needsPlacement = computed(() => {
  return !props.currentStore || props.currentStore !== props.resident.dreamJob
})

const canPlaceInDreamJob = computed(() => {
  return needsPlacement.value && props.dreamJobStoreBuilt && !props.dreamJobStoreFull
})

const statusBorderColor = computed(() => {
  if (!props.currentStore) {
    return 'border-gray-400 dark:border-gray-600' // Unassigned
  }
  if (props.currentStore === props.resident.dreamJob) {
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

const displayName = computed(() => formatResidentName(props.resident.name))

// Generate avatar using DiceBear API
const avatarUrl = computed(() => {
  return getResidentAvatarUrl(displayName.value)
})

function getDreamJobName() {
  const store = props.stores.find(s => s.id === props.resident.dreamJob)
  return store?.name || props.resident.dreamJob
}

function getCurrentStoreName() {
  const store = props.stores.find(s => s.id === props.currentStore)
  return store?.name || props.currentStore
}
</script>
