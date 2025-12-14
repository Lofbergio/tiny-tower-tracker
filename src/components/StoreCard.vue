<template>
  <Card
    class="overflow-hidden border-l-4 transition-all hover:shadow-md"
    :style="{ borderLeftColor: categoryColors.border }"
  >
    <div
      class="flex flex-col space-y-1 p-4 md:space-y-1.5 md:p-4"
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
          {{ capacity }}/3
        </Badge>
      </div>
      <p class="text-xs font-medium text-muted-foreground md:text-sm">
        {{ store.category }}
      </p>
    </div>
    <div class="p-4 pt-0 md:p-4 md:pt-0">
      <div v-if="residents.length > 0" class="space-y-2">
        <p class="text-sm font-medium">Residents</p>
        <div class="overflow-hidden rounded-md border bg-background/60">
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="flex min-h-[44px] items-center justify-between gap-3 border-b px-3 last:border-b-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm">{{ getResidentName(residentId) }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="min-h-[44px] px-3 text-muted-foreground hover:text-foreground"
              @click="$emit('remove-resident', residentId)"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground">No residents assigned</div>

      <div v-if="capacity < 3" class="mt-3 space-y-2 md:mt-4">
        <Button variant="outline" size="sm" class="w-full" @click="$emit('add-resident')">
          Add Resident ({{ capacity }}/3)
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        class="mt-2 min-h-[44px] w-full text-destructive hover:text-destructive"
        @click="$emit('remove-store')"
      >
        Remove Store
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
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
  'add-resident': []
}>()

const { isDark } = useDarkMode()
const store = computed(() => props.userStore.store)
const residents = computed(() => props.userStore.residents)
const capacity = computed(() => residents.value.length)

const categoryColors = computed(() => getCategoryColors(store.value.category, isDark.value))

function getResidentName(residentId: string) {
  const resident = props.residents.find(r => r.id === residentId)
  return resident?.name || 'Unknown'
}
</script>
