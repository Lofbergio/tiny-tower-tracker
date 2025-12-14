<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Stores</h1>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogHeader>
          <DialogTitle>Add Store</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Select Store</label>
              <Select v-model="selectedStoreId">
                <option value="">Choose a store...</option>
                <option
                  v-for="store in availableStores"
                  :key="store.id"
                  :value="store.id"
                >
                  {{ store.name }} ({{ store.category }})
                </option>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
          <Button @click="handleAddStore" :disabled="!selectedStoreId">Add</Button>
        </DialogFooter>
      </Dialog>
      <Button @click="showAddDialog = true">Add Store</Button>
    </div>

    <div v-if="userStores.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">No stores added yet.</p>
    </div>

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
import { computed, ref, onMounted } from 'vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Select from '@/components/ui/Select.vue'
import StoreCard from '@/components/StoreCard.vue'
import { useStores, loadStores } from '@/composables/useStores'
import { useResidents } from '@/composables/useResidents'

const { userStores, allStores, addStore, removeStore, removeResidentFromStore } = useStores()
const { residents } = useResidents()

const showAddDialog = ref(false)
const selectedStoreId = ref('')

const availableStores = computed(() => {
  const builtStoreIds = new Set(userStores.value.map(us => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
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

