<template>
  <Card
    class="overflow-hidden border-l-4 transition-all hover:shadow-md"
    :style="{ borderLeftColor: categoryColors.border }"
  >
    <div
      class="flex flex-col space-y-1 p-3 md:space-y-1.5 md:p-6"
      :style="{ backgroundColor: categoryColors.bg }"
    >
      <div class="flex items-center justify-between">
        <h3
          class="flex items-center gap-2 text-lg font-semibold leading-tight md:text-2xl md:leading-none md:tracking-tight"
        >
          <StoreIcon :category="store.category" :size="32" class="shrink-0" />
          <span>{{ store.name }}</span>
        </h3>
        <Badge :variant="capacity >= 3 ? 'destructive' : 'secondary'" class="text-xs">
          👥 {{ capacity }}/3
        </Badge>
      </div>
      <p class="text-xs md:text-sm" :style="{ color: categoryColors.primary }">
        {{ store.category }}
      </p>
    </div>
    <div class="p-3 pt-0 md:p-6 md:pt-0">
      <div v-if="residents.length > 0" class="space-y-1.5 md:space-y-2">
        <p class="text-xs font-medium md:text-sm">Residents:</p>
        <div class="space-y-1">
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="flex items-center justify-between text-xs md:text-sm"
          >
            <span>{{ getResidentName(residentId) }}</span>
            <Button variant="ghost" size="sm" @click="$emit('remove-resident', residentId)">
              Remove
            </Button>
          </div>
        </div>
      </div>
      <div v-else class="text-muted-foreground text-xs md:text-sm">No residents assigned</div>
      <Button
        variant="destructive"
        size="sm"
        class="mt-3 w-full md:mt-4"
        @click="$emit('remove-store')"
      >
        Remove Store
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Resident, Store, UserStore } from '@/types'
import { getCategoryColors } from '@/utils/categoryColors'
import { computed } from 'vue'
import StoreIcon from './StoreIcon.vue'
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

const categoryColors = computed(() => getCategoryColors(store.value.category))

function getResidentName(residentId: string) {
  const resident = props.residents.find(r => r.id === residentId)
  return resident?.name || 'Unknown'
}
</script>
