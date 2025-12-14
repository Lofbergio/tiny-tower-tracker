<template>
  <Card>
    <div class="flex flex-col space-y-1.5 p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ store.name }}</h3>
        <Badge :variant="capacity >= 3 ? 'destructive' : 'secondary'"> {{ capacity }}/3 </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ store.category }}</p>
    </div>
    <div class="p-6 pt-0">
      <div v-if="residents.length > 0" class="space-y-2">
        <p class="text-sm font-medium">Residents:</p>
        <div class="space-y-1">
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="flex items-center justify-between text-sm"
          >
            <span>{{ getResidentName(residentId) }}</span>
            <Button variant="ghost" size="sm" @click="$emit('remove-resident', residentId)">
              Remove
            </Button>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground">No residents assigned</div>
      <Button variant="destructive" size="sm" class="mt-4 w-full" @click="$emit('remove-store')">
        Remove Store
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Resident, Store, UserStore } from '@/types'
import { computed } from 'vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

interface Props {
  userStore: UserStore & { store: Store }
  residents: Resident[]
}

const props = defineProps<Props>()

defineEmits<{
  'remove-store': []
  'remove-resident': [residentId: string]
}>()

const store = computed(() => props.userStore.store)
const residents = computed(() => props.userStore.residents)
const capacity = computed(() => residents.value.length)

function getResidentName(residentId: string) {
  const resident = props.residents.find(r => r.id === residentId)
  return resident?.name || 'Unknown'
}
</script>
