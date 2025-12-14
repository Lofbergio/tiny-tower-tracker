<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ resident.name }}</CardTitle>
    </CardHeader>
    <CardContent>
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
        <div v-if="needsPlacement" class="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-2">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Needs placement in dream job store
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        class="mt-4 w-full"
        @click="$emit('remove-resident')"
      >
        Remove Resident
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './ui/Card.vue'
import CardHeader from './ui/CardHeader.vue'
import CardTitle from './ui/CardTitle.vue'
import CardContent from './ui/CardContent.vue'
import Button from './ui/Button.vue'
import type { Resident, Store } from '@/types'

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

