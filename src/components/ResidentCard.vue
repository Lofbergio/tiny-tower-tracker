<template>
  <Card
    class="overflow-hidden border-l-4 transition-all hover:shadow-md"
    :class="statusBorderColor"
  >
    <div class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-6">
      <div class="flex items-center gap-3">
        <img
          :src="avatarUrl"
          :alt="displayName"
          class="h-12 w-12 shrink-0 rounded-full border-2"
          :class="statusBorderColor.replace('border-l-4', 'border')"
        />
        <h3
          class="flex-1 text-lg font-semibold leading-tight md:text-2xl md:leading-none md:tracking-tight"
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
          v-if="needsPlacement && canPlaceInDreamJob"
          class="rounded bg-yellow-50 p-1.5 dark:bg-yellow-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200 md:text-sm">
            Needs placement in dream job store
          </p>
        </div>
        <div
          v-else-if="needsPlacement && !canPlaceInDreamJob"
          class="rounded bg-orange-50 p-1.5 dark:bg-orange-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-orange-800 dark:text-orange-200 md:text-sm">
            ⚠️ Dream job store is full (3/3)
          </p>
        </div>
      </div>

      <div class="mt-3 space-y-2 md:mt-4">
        <Button
          v-if="needsPlacement && canPlaceInDreamJob"
          variant="default"
          size="sm"
          class="w-full"
          @click="$emit('place-in-dream-job')"
        >
          ✨ Place in Dream Job
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
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

interface Props {
  resident: Resident
  stores: Store[]
  currentStore?: string
  dreamJobStoreFull?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentStore: undefined,
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
  return needsPlacement.value && !props.dreamJobStoreFull
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
