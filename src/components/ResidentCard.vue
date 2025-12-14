<template>
  <Card
    class="overflow-hidden border-l-4 transition-all hover:shadow-md"
    :class="statusBorderColor"
  >
    <div class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-6">
      <div class="flex items-center gap-3">
        <img
          :src="avatarUrl"
          :alt="resident.name"
          class="h-12 w-12 shrink-0 rounded-full border-2"
          :class="statusBorderColor.replace('border-l-4', 'border')"
        />
        <h3
          class="flex-1 text-lg font-semibold leading-tight md:text-2xl md:leading-none md:tracking-tight"
        >
          {{ resident.name }}
        </h3>
      </div>
    </div>
    <div class="p-3 pt-0 md:p-6 md:pt-0">
      <div class="space-y-1.5 md:space-y-2">
        <div>
          <p class="text-xs font-medium md:text-sm">Dream Job:</p>
          <p class="text-muted-foreground text-xs md:text-sm">{{ getDreamJobName() }}</p>
        </div>
        <div v-if="resident.currentStore">
          <p class="text-xs font-medium md:text-sm">Current Store:</p>
          <p class="text-muted-foreground text-xs md:text-sm">{{ getCurrentStoreName() }}</p>
        </div>
        <div v-else>
          <p class="text-muted-foreground text-xs md:text-sm">Not placed in any store</p>
        </div>
        <div
          v-if="needsPlacement"
          class="rounded bg-yellow-50 p-1.5 dark:bg-yellow-900/20 md:rounded-md md:p-2"
        >
          <p class="text-xs font-medium text-yellow-800 dark:text-yellow-200 md:text-sm">
            Needs placement in dream job store
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        class="mt-3 w-full md:mt-4"
        @click="$emit('remove-resident')"
      >
        Remove Resident
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Resident, Store } from '@/types'
import { computed } from 'vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

interface Props {
  resident: Resident
  stores: Store[]
}

const props = defineProps<Props>()

defineEmits<{
  'remove-resident': []
}>()

const needsPlacement = computed(() => {
  return !props.resident.currentStore || props.resident.currentStore !== props.resident.dreamJob
})

const statusBorderColor = computed(() => {
  if (!props.resident.currentStore) {
    return 'border-gray-400 dark:border-gray-600' // Unassigned
  }
  if (props.resident.currentStore === props.resident.dreamJob) {
    return 'border-green-500 dark:border-green-600' // In dream job
  }
  return 'border-yellow-500 dark:border-yellow-600' // Needs placement
})

// Generate avatar using DiceBear API
const avatarUrl = computed(() => {
  const seed = props.resident.name.toLowerCase().replace(/\s+/g, '-')
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
})

function getDreamJobName() {
  const store = props.stores.find(s => s.id === props.resident.dreamJob)
  return store?.name || props.resident.dreamJob
}

function getCurrentStoreName() {
  const store = props.stores.find(s => s.id === props.resident.currentStore)
  return store?.name || props.resident.currentStore
}
</script>
