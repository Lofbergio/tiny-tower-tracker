<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <PageHeader icon="🏪">
      <template #title>
        <span
          class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400"
        >
          Stores
        </span>
      </template>
      <template #subtitle>Food • Service • Recreation • Retail • Creative</template>
      <template #aside>
        <TowerIllustration
          :width="110"
          :height="165"
          class="opacity-70 transition-opacity hover:opacity-100 motion-safe:animate-float-slow"
        />
      </template>
    </PageHeader>

    <!-- Available Stores Section -->
    <div v-if="availableStores.length > 0 && userStoresWithData.length > 0" class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <span>Add More Stores</span>
        </h2>
        <Badge variant="default">{{ availableStores.length }} available</Badge>
      </div>
      <TransitionGroup
        tag="div"
        name="list"
        class="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card
          v-for="store in availableStores.slice(0, 6)"
          :key="store.id"
          class="pressable card-game group cursor-pointer touch-manipulation overflow-hidden border-l-4 transition-all hover:shadow-lg"
          :style="{ borderLeftColor: categoryColors(store.category).border }"
          @click="handleAddStore(store.id)"
        >
          <div
            class="relative flex flex-col space-y-1 p-3 md:p-4"
            :style="{ backgroundColor: categoryColors(store.category).bg }"
          >
            <div class="flex items-center gap-3">
              <StoreIcon :category="store.category" :size="40" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold leading-tight md:text-lg">
                  {{ store.name }}
                </h3>
                <p class="line-clamp-1 text-xs font-medium text-muted-foreground">
                  {{ store.category }}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </TransitionGroup>
      <Button
        v-if="availableStores.length > 6"
        variant="outline"
        class="mt-3 w-full"
        @click="showAddDialog = true"
      >
        View All {{ availableStores.length }} Stores
      </Button>
    </div>

    <!-- First Time Experience - Show Available Stores -->
    <div v-if="userStoresWithData.length === 0 && availableStores.length > 0" class="mb-8">
      <EmptyState
        title="No Stores Yet"
        description="Build stores in your tower and assign residents to work in them! Click any store below to add it."
        :icon="StoresEmptyIcon"
      />
      <div class="mt-6">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span>Available Stores</span>
        </h2>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          <Card
            v-for="store in availableStores.slice(0, 9)"
            :key="store.id"
            class="pressable card-game group cursor-pointer touch-manipulation overflow-hidden border-l-4 transition-all hover:shadow-lg"
            :style="{ borderLeftColor: categoryColors(store.category).border }"
            @click="handleAddStore(store.id)"
          >
            <div
              class="relative flex flex-col space-y-1 p-3 md:p-4"
              :style="{ backgroundColor: categoryColors(store.category).bg }"
            >
              <div class="flex items-center gap-3">
                <StoreIcon :category="store.category" :size="40" class="shrink-0" />
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-semibold leading-tight md:text-lg">
                    {{ store.name }}
                  </h3>
                  <p class="line-clamp-1 text-xs font-medium text-muted-foreground">
                    {{ store.category }}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TransitionGroup>
        <Button
          v-if="availableStores.length > 9"
          variant="outline"
          class="mt-3 w-full"
          @click="showAddDialog = true"
        >
          View All {{ availableStores.length }} Stores
        </Button>
      </div>
    </div>

    <!-- Your Stores Section -->
    <div v-if="userStoresWithData.length > 0" class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <span>Your Stores</span>
        </h2>
        <Badge variant="secondary">{{ userStoresWithData.length }}</Badge>
      </div>
    </div>

    <div v-if="userStoresWithData.length > 0">
      <div v-if="activeStores.length > 0" class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <span>Needs Attention</span>
          </h2>
          <span class="text-sm text-muted-foreground">{{ activeStores.length }}</span>
        </div>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="item in activeStores"
            :id="getStoreAnchorId(item.userStore.storeId)"
            :key="item.userStore.storeId"
            :class="[
              'scroll-mt-20',
              focusedStoreId === item.userStore.storeId
                ? 'rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
                : '',
            ]"
          >
            <StoreCard
              :user-store="item.userStore"
              :residents="residents"
              :is-complete="false"
              @remove-resident="handleRemoveResident(item.userStore.storeId, $event)"
              @add-resident="handleAddResidentToStore(item.userStore.storeId)"
            />
          </div>
        </TransitionGroup>
      </div>

      <div v-if="completeStores.length > 0">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <span>All Set</span>
          </h2>
          <span class="text-sm text-muted-foreground">{{ completeStores.length }}</span>
        </div>
        <TransitionGroup
          tag="div"
          name="list"
          class="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="item in completeStores"
            :id="getStoreAnchorId(item.userStore.storeId)"
            :key="item.userStore.storeId"
            :class="[
              'scroll-mt-20',
              focusedStoreId === item.userStore.storeId
                ? 'rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
                : '',
            ]"
          >
            <StoreCard
              :user-store="item.userStore"
              :residents="residents"
              :is-complete="true"
              @remove-resident="handleRemoveResident(item.userStore.storeId, $event)"
              @add-resident="handleAddResidentToStore(item.userStore.storeId)"
            />
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Full Store List Dialog (only shown when clicking "View All") -->
    <Dialog :open="showAddDialog" @update:open="handleDialogOpenChange">
      <DialogContent>
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogTitle>All Available Stores ({{ filteredStores.length }})</DialogTitle>
        </div>
        <div class="space-y-3">
          <Input v-model="searchQuery" placeholder="Search stores..." class="w-full" />
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="cat in categories"
              :key="cat"
              :variant="selectedCategory === cat ? 'default' : 'outline'"
              class="min-h-[44px] cursor-pointer gap-2 px-3 py-2 text-sm"
              @click="toggleCategory(cat)"
            >
              <StoreIcon :category="cat" :size="16" class="shrink-0" />
              <span>{{ cat }}</span>
            </Badge>
            <Badge
              v-if="selectedCategory"
              variant="secondary"
              class="min-h-[44px] cursor-pointer px-3 py-2 text-sm"
              @click="selectedCategory = null"
            >
              Clear filter
            </Badge>
          </div>
        </div>
        <div class="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
          <EmptyState
            v-if="filteredStores.length === 0"
            title="No stores found"
            description="Try a different search or clear the filters."
            :hide-illustration="true"
          />
          <Card
            v-for="store in filteredStores"
            :key="store.id"
            class="pressable card-game cursor-pointer touch-manipulation overflow-hidden border-l-4 transition-all hover:shadow-md"
            :style="{ borderLeftColor: categoryColors(store.category).border }"
            @click="handleAddStore(store.id)"
          >
            <div
              class="flex items-center gap-3 p-3"
              :style="{ backgroundColor: categoryColors(store.category).bg }"
            >
              <StoreIcon :category="store.category" :size="32" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="font-semibold leading-tight">{{ store.name }}</h3>
                <p class="text-xs font-medium text-muted-foreground">
                  {{ store.category }}
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div class="mt-4">
          <Button variant="outline" class="w-full" @click="showAddDialog = false">Close</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      :open="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      :variant="confirmDialogData.variant"
      :confirm-text="confirmDialogData.confirmText"
      @update:open="showConfirmDialog = $event"
      @confirm="confirmDialogData.onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import StoreCard from '@/components/StoreCard.vue'
import StoreIcon from '@/components/StoreIcon.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
import StoresEmptyIcon from '@/components/illustrations/StoresEmptyIcon.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Input from '@/components/ui/Input.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useDarkMode } from '@/composables/useDarkMode'
import { useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store, UserStore } from '@/types'
import { getCategoryColors } from '@/utils/categoryColors'
import { formatResidentName } from '@/utils/residentName'
import { useToast } from '@/utils/toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const storesStore = useStoresStore()
const residentsStore = useResidentsStore()
const { userStores: userStoresWithData, allStores } = useUserStoresWithData()
const { residents } = residentsStore
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()
const { isDark } = useDarkMode()
const route = useRoute()
const router = useRouter()

const focusedStoreId = computed(() => {
  const value = route.query.focusStoreId
  return typeof value === 'string' && value.trim() ? value : undefined
})

function getStoreAnchorId(storeId: string) {
  return `store-${storeId}`
}

async function focusStoreIfNeeded() {
  const storeId = focusedStoreId.value
  if (!storeId) return

  await nextTick()

  const el = document.getElementById(getStoreAnchorId(storeId))
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Clear query param after a short moment so the highlight doesn't stick.
  window.setTimeout(() => {
    const nextQuery = { ...route.query }
    delete nextQuery.focusStoreId
    router.replace({ query: nextQuery })
  }, 1200)
}

onMounted(() => {
  focusStoreIfNeeded()
})

watch(focusedStoreId, () => {
  focusStoreIfNeeded()
})

const residentById = computed(() => {
  const map = new Map<string, Resident>()
  for (const resident of residentsStore.residents) {
    map.set(resident.id, resident)
  }
  return map
})

const storeById = computed(() => {
  const map = new Map<string, Store>()
  for (const store of allStores.value) {
    map.set(store.id, store)
  }
  return map
})

const residentIdsByStoreId = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const us of userStoresWithData.value) {
    map.set(us.storeId, new Set(us.residents))
  }
  return map
})

const showAddDialog = ref(false)
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

const categoryColors = computed(
  () => (category: string) => getCategoryColors(category, isDark.value)
)

function isStoreComplete(storeId: string, assignedResidentIds: string[]): boolean {
  if (assignedResidentIds.length !== 3) {
    return false
  }
  return assignedResidentIds.every(residentId => {
    const resident = residentById.value.get(residentId)
    if (!resident) {
      return false
    }
    return resident.dreamJob === storeId
  })
}

const storesWithCompletion = computed(() => {
  return userStoresWithData.value.map((userStore: UserStore & { store: Store }) => {
    const complete = isStoreComplete(userStore.storeId, userStore.residents)
    return { userStore, complete }
  })
})

const activeStores = computed(() => storesWithCompletion.value.filter(s => !s.complete))
const completeStores = computed(() => storesWithCompletion.value.filter(s => s.complete))

const availableStores = computed(() => {
  const builtStoreIds = new Set(storesStore.userStores.map((us: UserStore) => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
})

const categories = computed(() => {
  const cats = new Set(allStores.value.map(s => s.category))
  return Array.from(cats).sort()
})

const filteredStores = computed(() => {
  let stores = availableStores.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    stores = stores.filter(
      s => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (selectedCategory.value) {
    stores = stores.filter(s => s.category === selectedCategory.value)
  }

  return stores
})

function toggleCategory(category: string) {
  selectedCategory.value = selectedCategory.value === category ? null : category
}

function handleDialogOpenChange(isOpen: boolean) {
  showAddDialog.value = isOpen
  if (!isOpen) {
    // Reset filters when dialog closes
    searchQuery.value = ''
    selectedCategory.value = null
  }
}

function handleAddStore(storeId: string) {
  const success = storesStore.addStore(storeId)
  if (success) {
    const store = storeById.value.get(storeId)
    toast.success(`✓ Added ${store?.name} (${store?.category})`)
    showAddDialog.value = false
  } else {
    toast.error('Store already exists')
  }
}

function handleAddResidentToStore(storeId: string) {
  // Find available residents (not in this store, ideally with this as dream job)
  const store = storeById.value.get(storeId)
  const residentIdsInStore = residentIdsByStoreId.value.get(storeId) ?? new Set<string>()
  const availableResidents = residents.filter((r: Resident) => !residentIdsInStore.has(r.id))

  if (availableResidents.length === 0) {
    toast.info('No available residents to assign')
    return
  }

  // Prefer residents with this as dream job
  const dreamJobResidents = availableResidents.filter((r: Resident) => r.dreamJob === storeId)
  const residentToAdd = dreamJobResidents.length > 0 ? dreamJobResidents[0] : availableResidents[0]

  const result = storesStore.addResidentToStore(storeId, residentToAdd.id)
  if (result.success) {
    toast.success(`Added ${formatResidentName(residentToAdd.name)} to ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to add resident')
  }
}

function handleRemoveResident(storeId: string, residentId: string) {
  const resident = residentById.value.get(residentId)
  if (!resident) {
    return
  }

  confirm({
    title: 'Remove Resident',
    message: `Are you sure you want to remove ${formatResidentName(resident.name)} from this store?`,
    variant: 'destructive',
    confirmText: 'Remove',
    onConfirm: () => {
      const success = storesStore.removeResidentFromStore(storeId, residentId)
      if (success) {
        toast.success(`Removed ${formatResidentName(resident.name)} from store`)
      } else {
        toast.error('Failed to remove resident')
      }
    },
  })
}
</script>
