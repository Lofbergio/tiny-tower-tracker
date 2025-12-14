<template>
  <div class="min-h-screen bg-background">
    <nav class="border-b sticky top-0 bg-background z-50">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <h1 class="text-xl font-bold">Tiny Tower Tracker</h1>
          <div class="flex gap-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              @click="showMobileMenu = !showMobileMenu"
            >
              Menu
            </Button>
          </div>
          <div class="hidden md:flex gap-2">
            <Button
              v-for="route in routes"
              :key="route.path"
              :variant="currentRoute === route.path ? 'default' : 'ghost'"
              @click="$router.push(route.path)"
            >
              {{ route.name }}
            </Button>
          </div>
        </div>
      </div>
      <div v-if="showMobileMenu" class="md:hidden border-t">
        <div class="container mx-auto px-4 py-2 space-y-1">
          <Button
            v-for="route in routes"
            :key="route.path"
            variant="ghost"
            class="w-full justify-start"
            @click="handleNavClick(route.path)"
          >
            {{ route.name }}
          </Button>
        </div>
      </div>
    </nav>

    <main class="min-h-[calc(100vh-4rem)]">
      <div v-if="isLoading" class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div class="text-center">
          <p class="text-muted-foreground">Loading...</p>
        </div>
      </div>
      <RouterView v-else />
    </main>

    <!-- Mobile Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50">
      <div class="grid grid-cols-4 gap-1 p-2">
        <button
          v-for="route in routes"
          :key="route.path"
          :class="[
            'flex flex-col items-center justify-center p-2 rounded-md text-xs transition-colors',
            currentRoute === route.path
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          ]"
          @click="$router.push(route.path)"
        >
          <span>{{ route.name }}</span>
        </button>
      </div>
    </div>
    <div class="h-16 md:hidden" /> <!-- Spacer for mobile nav -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from './components/ui/Button.vue'
import { loadStores } from './composables/useStores'
import { loadMissions } from './composables/useMissions'

const router = useRouter()
const route = useRoute()
const showMobileMenu = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([loadStores(), loadMissions()])
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    isLoading.value = false
  }
})

const routes = [
  { path: '/', name: 'Dashboard' },
  { path: '/missions', name: 'Missions' },
  { path: '/residents', name: 'Residents' },
  { path: '/stores', name: 'Stores' },
]

const currentRoute = computed(() => route.path)

function handleNavClick(path: string) {
  router.push(path)
  showMobileMenu.value = false
}

watch(() => route.path, () => {
  showMobileMenu.value = false
})
</script>

