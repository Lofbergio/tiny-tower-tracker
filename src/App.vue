<template>
  <ErrorBoundary>
    <div class="bg-background relative min-h-screen">
      <div class="bg-grid-pattern pointer-events-none fixed inset-0" />
      <div class="relative">
        <nav class="bg-background/80 sticky top-0 border-b backdrop-blur-sm">
          <div class="container mx-auto px-4">
            <div class="flex h-16 items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="text-2xl">🏢</div>
                <h1
                  class="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent"
                >
                  Tiny Tower Tracker
                </h1>
              </div>
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
                    class="relative"
                    @click="$router.push(navRoute.path)"
                  >
                    {{ navRoute.name }}
                    <span
                      v-if="getPendingCount(navRoute.path) > 0"
                      class="bg-destructive text-destructive-foreground absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    >
                      {{
                        getPendingCount(navRoute.path) > 9 ? '9+' : getPendingCount(navRoute.path)
                      }}
                    </span>
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
          class="bg-background/95 fixed bottom-0 left-0 right-0 border-t backdrop-blur-sm md:hidden"
        >
          <div class="grid grid-cols-4 gap-1 p-2">
            <button
              v-for="mobileRoute in routes"
              :key="mobileRoute.path"
              :class="[
                'relative flex min-h-[60px] flex-col items-center justify-center rounded-md p-3 text-xs font-medium transition-colors',
                currentRoute === mobileRoute.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground active:bg-accent',
              ]"
              :aria-label="`Navigate to ${mobileRoute.name}`"
              :aria-current="currentRoute === mobileRoute.path ? 'page' : undefined"
              @click="$router.push(mobileRoute.path)"
            >
              <span>{{ mobileRoute.name }}</span>
              <span
                v-if="getPendingCount(mobileRoute.path) > 0"
                class="bg-destructive text-destructive-foreground absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              >
                {{
                  getPendingCount(mobileRoute.path) > 9 ? '9+' : getPendingCount(mobileRoute.path)
                }}
              </span>
            </button>
          </div>
        </div>
        <div class="h-[72px] md:hidden" />
        <!-- Spacer for mobile nav -->
      </div>
      <Toast />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import Button from './components/ui/Button.vue'
import DarkModeToggle from './components/ui/DarkModeToggle.vue'
import Toast from './components/ui/Toast.vue'
import {
  useCompletableMissions,
  useMissionsQuery,
  useStoresQuery,
  useUserMissionsWithData,
} from './queries'
import { useResidentsStore } from './stores'

const router = useRouter()
const route = useRoute()
const showMobileMenu = ref(false)

// Preload data using Vue Query
const { isLoading: storesLoading } = useStoresQuery()
const { isLoading: missionsLoading } = useMissionsQuery()

const isLoading = computed(() => storesLoading.value || missionsLoading.value)

// Get pending counts for navigation badges
const { pendingMissions } = useUserMissionsWithData()
const { completableMissions } = useCompletableMissions()
const residentsStore = useResidentsStore()

const routes = [
  { path: '/', name: 'Dashboard' },
  { path: '/missions', name: 'Missions' },
  { path: '/residents', name: 'Residents' },
  { path: '/stores', name: 'Stores' },
]

const currentRoute = computed(() => route.path)

function getPendingCount(path: string): number {
  if (path === '/missions') {
    return pendingMissions.value.length
  }
  if (path === '/residents') {
    return residentsStore.getResidentsNotInDreamJob().length
  }
  if (path === '/') {
    // Dashboard: completable missions + residents needing placement
    const residentsNeedingPlacement = residentsStore.getResidentsNotInDreamJob().length
    return completableMissions.value.length + residentsNeedingPlacement
  }
  return 0
}

function handleNavClick(path: string) {
  router.push(path)
  showMobileMenu.value = false
}
</script>
