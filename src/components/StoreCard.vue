<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>{{ store.name }}</CardTitle>
        <Badge :variant="capacity >= 3 ? 'destructive' : 'secondary'">
          {{ capacity }}/3
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ store.category }}</p>
    </CardHeader>
    <CardContent>
      <div v-if="residents.length > 0" class="space-y-2">
        <p class="text-sm font-medium">Residents:</p>
        <div class="space-y-1">
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="flex items-center justify-between text-sm"
          >
            <span>{{ getResidentName(residentId) }}</span>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('remove-resident', residentId)"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground">
        No residents assigned
      </div>
      <Button
        variant="destructive"
        size="sm"
        class="mt-4 w-full"
        @click="$emit('remove-store')"
      >
        Remove Store
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
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import type { Store, UserStore, Resident } from '@/types'

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

