<template>
  <Card>
    <div class="flex flex-col space-y-1.5 p-6">
      <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ resident.name }}</h3>
    </div>
    <div class="p-6 pt-0">
      <div class="space-y-2">
        <div>
          <p class="text-sm font-medium">Dream Job:</p>
          <p class="text-sm text-muted-foreground">{{ getDreamJobName() }}</p>
        </div>
        <div v-if="resident.currentStore">
          <p class="text-sm font-medium">Current Store:</p>
          <p class="text-sm text-muted-foreground">{{ getCurrentStoreName() }}</p>
        </div>
        <div v-else>
          <p class="text-sm text-muted-foreground">Not placed in any store</p>
        </div>
        <div v-if="needsPlacement" class="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Needs placement in dream job store
          </p>
        </div>
      </div>
      <Button variant="destructive" size="sm" class="mt-4 w-full" @click="$emit('remove-resident')">
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

function getDreamJobName() {
  const store = props.stores.find(s => s.id === props.resident.dreamJob)
  return store?.name || props.resident.dreamJob
}

function getCurrentStoreName() {
  const store = props.stores.find(s => s.id === props.resident.currentStore)
  return store?.name || props.resident.currentStore
}
</script>
