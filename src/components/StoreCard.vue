<template>
  <Card
    class="card-game group flex h-full flex-col overflow-hidden border-l-4 transition-all hover:shadow-md"
    :class="
      isComplete ? 'opacity-80 motion-safe:transition-opacity motion-safe:hover:opacity-100' : ''
    "
    :style="{ borderLeftColor: categoryColors.border }"
    :glow="isComplete ? 'success' : false"
  >
    <div class="flex flex-col space-y-1 p-3 md:p-4" :style="{ backgroundColor: categoryColors.bg }">
      <div class="flex items-center justify-between gap-2">
        <h3
          class="flex min-w-0 flex-1 items-center gap-2 text-base font-bold leading-tight md:text-lg"
        >
          <StoreIcon :category="store.category" :size="28" class="shrink-0" />
          <span class="truncate">{{ store.name }}</span>
        </h3>
        <Badge
          :variant="isComplete ? 'secondary' : 'secondary'"
          :class="[
            'count-badge-game shrink-0 text-[10px] tabular-nums md:text-xs',
            isComplete ? 'badge-pop' : '',
          ]"
        >
          <span v-if="isComplete" class="flex items-center gap-0.5">
            <span class="check-celebrate inline-block">✓</span> 3/3
          </span>
          <span v-else>{{ capacity }}/3</span>
        </Badge>
      </div>
      <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
        {{ store.category }}
      </p>
    </div>
    <div class="flex flex-1 flex-col gap-3 p-3 pt-2 md:p-4 md:pt-3">
      <!-- Resident Slots -->
      <div class="space-y-1.5">
        <p class="text-xs font-semibold text-muted-foreground">Residents</p>
        <div class="grid gap-1.5">
          <!-- Filled slots -->
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="slot-filled group/slot flex min-h-[44px] items-center gap-2.5 rounded-lg p-2 transition-colors"
          >
            <div class="relative">
              <Avatar
                :src="getResidentAvatarUrl(residentId)"
                :alt="getResidentName(residentId)"
                size="sm"
              />
              <span
                v-if="isResidentInDreamJob(residentId)"
                class="status-dot status-dot-success absolute -bottom-0.5 -right-0.5 h-2 w-2"
              />
            </div>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
              getResidentName(residentId)
            }}</span>
            <Button
              v-if="!isComplete"
              variant="ghost"
              size="sm"
              class="h-8 px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/slot:opacity-100"
              @click="$emit('remove-resident', residentId)"
            >
              ✕
            </Button>
          </div>
          <!-- Empty slots -->
          <div
            v-for="i in emptySlots"
            :key="`empty-${i}`"
            class="slot-empty flex min-h-[44px] items-center justify-center gap-2 rounded-lg p-2 text-xs text-muted-foreground"
          >
            <span>Empty slot</span>
          </div>
        </div>
      </div>

      <!-- Add action -->
      <div v-if="!isComplete && capacity < 3" class="mt-auto">
        <Button variant="outline" size="sm" class="w-full" @click="$emit('add-resident')">
          <span class="mr-1">+</span> Add Resident
        </Button>
      </div>
      <div v-else-if="isComplete" class="mt-auto">
        <p
          class="flex items-center justify-center gap-1 py-1 text-center text-xs font-medium text-green-600 dark:text-green-400"
        >
          <span class="motion-safe:animate-sparkle">🎉</span> Fully staffed!
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
import type { Resident, Store, UserStore } from '@/types'
import { getResidentAvatarUrl as getResidentAvatarUrlByName } from '@/utils/avatar'
import { getCategoryColors } from '@/utils/categoryColors'
import { formatResidentName } from '@/utils/residentName'
import { computed } from 'vue'
import StoreIcon from './StoreIcon.vue'
import Avatar from './ui/Avatar.vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

const {
  userStore,
  residents: allResidents,
  isComplete = false,
} = defineProps<{
  userStore: UserStore & { store: Store }
  residents: Resident[]
  isComplete?: boolean
}>()

defineEmits<{
  'remove-resident': [residentId: string]
  'add-resident': []
}>()

const { isDark } = useDarkMode()
const store = computed(() => userStore.store)
const residents = computed(() => userStore.residents)
const capacity = computed(() => residents.value.length)
const emptySlots = computed(() => Math.max(0, 3 - capacity.value))

const residentById = computed(() => {
  const map = new Map<string, Resident>()
  for (const resident of allResidents) {
    map.set(resident.id, resident)
  }
  return map
})

const categoryColors = computed(() => getCategoryColors(store.value.category, isDark.value))

function getResidentName(residentId: string) {
  const resident = residentById.value.get(residentId)
  return resident ? formatResidentName(resident.name) : 'Unknown'
}

function getResidentAvatarUrl(residentId: string) {
  return getResidentAvatarUrlByName(getResidentName(residentId))
}

function isResidentInDreamJob(residentId: string) {
  const resident = residentById.value.get(residentId)
  return resident?.dreamJob === store.value.id
}
</script>
