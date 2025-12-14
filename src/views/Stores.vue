<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Stores</h1>
        <p class="text-sm text-muted-foreground">Build and manage stores in your tower</p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogContent>
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle>Add Store</DialogTitle>
          </div>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Select Store</Label>
              <SearchableSelect
                v-model="selectedStoreId"
                :items="availableStoreItems"
                placeholder="Choose a store..."
                search-placeholder="Search stores…"
              />
            </div>
          </div>
          <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
            <Button :disabled="!selectedStoreId" @click="handleAddStore">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button @click="showAddDialog = true">Add Store</Button>
    </div>

    <EmptyState
      v-if="userStores.length === 0"
      title="No Stores Yet"
      description="Build stores in your tower and assign residents to work in them!"
    >
      <Button @click="showAddDialog = true">Add Your First Store</Button>
    </EmptyState>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StoreCard
        v-for="userStore in userStores"
        :key="userStore.storeId"
        :user-store="userStore"
        :residents="residents"
        @remove-store="handleRemoveStore(userStore.storeId)"
        @remove-resident="handleRemoveResident(userStore.storeId, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import StoreCard from '@/components/StoreCard.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useResidents } from '@/composables/useResidents'
import { loadStores, useStores } from '@/composables/useStores'
import { computed, onMounted, ref } from 'vue'

const { userStores, allStores, addStore, removeStore, removeResidentFromStore } = useStores()
const { residents } = useResidents()

const showAddDialog = ref(false)
const selectedStoreId = ref('')

const availableStores = computed(() => {
  const builtStoreIds = new Set(userStores.value.map(us => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
})

const availableStoreItems = computed(() => {
  return availableStores.value.map(store => ({
    value: store.id,
    label: `${store.name} (${store.category})`,
  }))
})

function handleAddStore() {
  if (selectedStoreId.value) {
    addStore(selectedStoreId.value)
    selectedStoreId.value = ''
    showAddDialog.value = false
  }
}

function handleRemoveStore(storeId: string) {
  removeStore(storeId)
}

function handleRemoveResident(storeId: string, residentId: string) {
  removeResidentFromStore(storeId, residentId)
}

onMounted(async () => {
  await loadStores()
})
</script>
