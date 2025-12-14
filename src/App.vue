<template>
  <div class="bg-background relative min-h-screen">
    <div class="bg-grid-pattern pointer-events-none fixed inset-0" />
    <div class="relative">
      <nav class="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div class="container mx-auto px-4">
          <div class="flex h-16 items-center justify-between">
            <h1
              class="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent"
            >
              Tiny Tower Tracker
            </h1>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                @click="toggleDarkMode"
                class="md:hidden"
                :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              >
                <svg
                  v-if="isDark"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </Button>
              <div class="flex gap-2 md:hidden">
                <Button variant="ghost" size="sm" @click="showMobileMenu = !showMobileMenu">
                  Menu
                </Button>
              </div>
              <div class="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="toggleDarkMode"
                  :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                >
                  <svg
                    v-if="isDark"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                </Button>
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
        </div>
        <div v-if="showMobileMenu" class="border-t md:hidden">
          <div class="container mx-auto space-y-1 px-4 py-2">
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
        <div v-if="isLoading" class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div class="text-center">
            <div
              class="border-primary mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            />
            <p class="text-muted-foreground">Loading your tower...</p>
          </div>
        </div>
        <RouterView v-else />
      </main>

      <!-- Mobile Bottom Navigation -->
      <div
        class="bg-background/80 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-sm md:hidden"
      >
        <div class="grid grid-cols-4 gap-1 p-2">
          <button
            v-for="route in routes"
            :key="route.path"
            :class="[
              'flex flex-col items-center justify-center rounded-md p-2 text-xs transition-colors',
              currentRoute === route.path
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            ]"
            @click="$router.push(route.path)"
          >
            <span>{{ route.name }}</span>
          </button>
        </div>
      </div>
      <div class="h-16 md:hidden" />
      <!-- Spacer for mobile nav -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from './components/ui/Button.vue'
import { useDarkMode } from './composables/useDarkMode'
import { loadMissions } from './composables/useMissions'
import { loadStores } from './composables/useStores'

const router = useRouter()
const route = useRoute()
const { isDark, toggle: toggleDarkMode } = useDarkMode()
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

watch(
  () => route.path,
  () => {
    showMobileMenu.value = false
  }
)
</script>
