<template>
  <ErrorBoundary>
    <div class="bg-background relative min-h-screen">
      <div class="bg-grid-pattern pointer-events-none fixed inset-0" />
      <div class="relative">
        <nav class="bg-background/80 sticky top-0 border-b backdrop-blur-sm">
          <div class="container mx-auto px-4">
            <div class="flex h-16 items-center justify-between">
              <h1
                class="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent"
              >
                Tiny Tower Tracker
              </h1>
              <div class="flex items-center gap-2">
                <DarkModeToggle class="md:hidden" />
                <div class="flex gap-2 md:hidden">
                  <Button variant="ghost" size="sm" @click="showMobileMenu = !showMobileMenu">
                    Menu
                  </Button>
                </div>
                <div class="hidden items-center gap-2 md:flex">
                  <DarkModeToggle />
                  <Button
                    v-for="navRoute in routes"
                    :key="navRoute.path"
                    :variant="currentRoute === navRoute.path ? 'default' : 'ghost'"
                    @click="$router.push(navRoute.path)"
                  >
                    {{ navRoute.name }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="showMobileMenu" class="border-t md:hidden">
            <div class="container mx-auto space-y-1 px-4 py-2">
              <Button
                v-for="menuRoute in routes"
                :key="menuRoute.path"
                variant="ghost"
                class="w-full justify-start"
                @click="handleNavClick(menuRoute.path)"
              >
                {{ menuRoute.name }}
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
          <RouterView v-else-if="!isLoading" />
        </main>

        <!-- Mobile Bottom Navigation -->
        <div
          class="bg-background/80 fixed bottom-0 left-0 right-0 border-t backdrop-blur-sm md:hidden"
        >
          <div class="grid grid-cols-4 gap-1 p-2">
            <button
              v-for="mobileRoute in routes"
              :key="mobileRoute.path"
              :class="[
                'flex flex-col items-center justify-center rounded-md p-2 text-xs transition-colors',
                currentRoute === mobileRoute.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              ]"
              :aria-label="`Navigate to ${mobileRoute.name}`"
              :aria-current="currentRoute === mobileRoute.path ? 'page' : undefined"
              @click="$router.push(mobileRoute.path)"
            >
              <span>{{ mobileRoute.name }}</span>
            </button>
          </div>
        </div>
        <div class="h-16 md:hidden" />
        <!-- Spacer for mobile nav -->
      </div>
      <Toast />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import Button from './components/ui/Button.vue'
import DarkModeToggle from './components/ui/DarkModeToggle.vue'
import Toast from './components/ui/Toast.vue'
import { useMissionsQuery, useStoresQuery } from './queries'

const router = useRouter()
const route = useRoute()
const showMobileMenu = ref(false)

// Preload data using Vue Query
const { isLoading: storesLoading } = useStoresQuery()
const { isLoading: missionsLoading } = useMissionsQuery()

const isLoading = computed(() => storesLoading.value || missionsLoading.value)

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
