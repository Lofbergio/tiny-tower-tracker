<template>
  <ErrorBoundary>
    <TooltipProvider>
      <div class="relative min-h-screen bg-background">
        <div class="bg-grid-pattern pointer-events-none fixed inset-0" aria-hidden="true" />
        <div class="relative">
          <a
            href="#main-content"
            class="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <nav :class="topNavClass">
            <div class="container mx-auto px-4">
              <div class="flex h-16 items-center justify-between">
                <div class="group flex select-none items-center gap-2">
                  <div aria-hidden="true" class="text-2xl motion-safe:group-hover:animate-jiggle">
                    🏢
                  </div>
                  <h1
                    class="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.01]"
                  >
                    Tiny Tower Tracker
                  </h1>
                </div>
                <div class="flex items-center gap-2">
                  <DarkModeToggle class="md:hidden" />
                  <div class="flex gap-2 md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Toggle menu"
                      aria-controls="mobile-menu"
                      :aria-expanded="showMobileMenu"
                      @click="showMobileMenu = !showMobileMenu"
                    >
                      Menu
                    </Button>
                  </div>
                  <div class="hidden items-center gap-3 md:flex">
                    <DarkModeToggle />
                    <div v-for="navRoute in routes" :key="navRoute.path" class="relative">
                      <Button
                        :variant="currentRoute === navRoute.path ? 'default' : 'ghost'"
                        class="group"
                        @click="$router.push(navRoute.path)"
                      >
                        <span
                          aria-hidden="true"
                          class="mr-1 inline-block motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:animate-jiggle motion-safe:group-active:scale-110"
                        >
                          {{ navRoute.icon }}
                        </span>
                        {{ navRoute.name }}
                      </Button>
                      <span
                        v-if="getPendingCount(navRoute.path) > 0"
                        class="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground shadow"
                      >
                        {{
                          getPendingCount(navRoute.path) > 9 ? '9+' : getPendingCount(navRoute.path)
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Transition name="mobile-menu">
              <div v-if="showMobileMenu" id="mobile-menu" class="border-t md:hidden">
                <div class="container mx-auto space-y-1 px-4 py-2">
                  <Button
                    v-for="menuRoute in routes"
                    :key="menuRoute.path"
                    variant="ghost"
                    class="group w-full justify-start"
                    @click="handleNavClick(menuRoute.path)"
                  >
                    <span
                      aria-hidden="true"
                      class="mr-2 inline-block motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-active:scale-110"
                    >
                      {{ menuRoute.icon }}
                    </span>
                    {{ menuRoute.name }}
                    <CountBadge
                      v-if="getPendingCount(menuRoute.path) > 0"
                      :count="getPendingCount(menuRoute.path)"
                      class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground"
                    />
                  </Button>
                </div>
              </div>
            </Transition>
          </nav>

          <main id="main-content" tabindex="-1" class="min-h-[calc(100vh-4rem)]" :style="mainStyle">
            <div
              v-if="hasLoadError"
              class="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4"
            >
              <EmptyState
                title="⚠️ Couldn't load game data"
                description="The store/mission database didn't load. Check your connection and try again."
              >
                <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button class="w-full sm:w-auto" @click="retryLoad">Retry</Button>
                  <Button variant="outline" class="w-full sm:w-auto" @click="reloadPage">
                    Reload
                  </Button>
                </div>
                <p v-if="loadErrorMessage" class="mt-3 text-xs text-muted-foreground">
                  {{ loadErrorMessage }}
                </p>
              </EmptyState>
            </div>
            <div
              v-else-if="isLoading"
              class="flex min-h-[calc(100vh-4rem)] items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <div class="text-center">
                <div
                  class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none"
                />
                <p class="text-muted-foreground">Loading your tower...</p>
              </div>
            </div>
            <RouterView v-else v-slot="{ Component }">
              <div class="overflow-x-clip">
                <Transition :name="slideDirection" mode="out-in">
                  <component :is="Component" :key="route.fullPath" />
                </Transition>
              </div>
            </RouterView>
          </main>

          <!-- Mobile Bottom Navigation -->
          <div
            class="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden"
          >
            <div
              class="grid grid-cols-4 gap-1 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
            >
              <div v-for="mobileRoute in routes" :key="mobileRoute.path" class="relative">
                <button
                  :data-active="currentRoute === mobileRoute.path"
                  :class="[
                    'nav-item-game pressable-strong group flex h-full min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-xl p-1.5 text-[11px] font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    currentRoute === mobileRoute.path
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
                  ]"
                  :aria-label="`Navigate to ${mobileRoute.name}`"
                  :aria-current="currentRoute === mobileRoute.path ? 'page' : undefined"
                  @click="$router.push(mobileRoute.path)"
                >
                  <span
                    aria-hidden="true"
                    :class="[
                      'inline-block text-xl leading-none',
                      currentRoute === mobileRoute.path
                        ? 'motion-safe:animate-bounce-in'
                        : 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-active:scale-110',
                    ]"
                  >
                    {{ mobileRoute.icon }}
                  </span>
                  <span class="truncate">{{ mobileRoute.name }}</span>
                </button>
                <span
                  v-if="getPendingCount(mobileRoute.path) > 0"
                  class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground shadow"
                >
                  {{
                    getPendingCount(mobileRoute.path) > 9 ? '9+' : getPendingCount(mobileRoute.path)
                  }}
                </span>
              </div>
            </div>
          </div>
          <div class="h-[76px] md:hidden" />
          <!-- Spacer for mobile nav -->
        </div>
        <Toast />
      </div>
    </TooltipProvider>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import Button from './components/ui/Button.vue'
import CountBadge from './components/ui/CountBadge.vue'
import DarkModeToggle from './components/ui/DarkModeToggle.vue'
import EmptyState from './components/ui/EmptyState.vue'
import Toast from './components/ui/Toast.vue'
import TooltipProvider from './components/ui/TooltipProvider.vue'
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

const showTopNav = ref(true)
const lastScrollY = ref(0)

const TOP_NAV_HEIGHT_PX = 64
const HIDE_AFTER_SCROLL_Y = 72
const SCROLL_DELTA_PX = 10

const topNavClass = computed(() => [
  'top-0 z-40 border-b bg-background md:bg-background/80 md:backdrop-blur-sm',
  // Fixed so we can animate it away without leaving a layout gap
  'fixed inset-x-0',
  // Slide away on scroll-down, reappear on scroll-up
  'transform-gpu transition-transform duration-200 ease-out',
  showTopNav.value ? 'translate-y-0' : '-translate-y-full',
])

const mainStyle = computed(() => {
  return {
    paddingTop: `${TOP_NAV_HEIGHT_PX}px`,
    // PWA safe area for home indicator on notched devices
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }
})

// Preload data using Vue Query
const {
  isLoading: storesLoading,
  isError: storesIsError,
  error: storesError,
  refetch: refetchStores,
} = useStoresQuery()
const {
  isLoading: missionsLoading,
  isError: missionsIsError,
  error: missionsError,
  refetch: refetchMissions,
} = useMissionsQuery()

const isLoading = computed(() => storesLoading.value || missionsLoading.value)
const hasLoadError = computed(() => Boolean(storesIsError.value || missionsIsError.value))

const loadErrorMessage = computed(() => {
  const err = (storesError.value ?? missionsError.value) as unknown
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return ''
  }
})

function retryLoad() {
  refetchStores()
  refetchMissions()
}

function reloadPage() {
  window.location.reload()
}

function handleScroll() {
  if (showMobileMenu.value) {
    showTopNav.value = true
    lastScrollY.value = window.scrollY
    return
  }

  const currentY = window.scrollY
  const delta = currentY - lastScrollY.value

  if (currentY <= 0) {
    showTopNav.value = true
    lastScrollY.value = currentY
    return
  }

  if (Math.abs(delta) < SCROLL_DELTA_PX) return

  // Scrolling down
  if (delta > 0 && currentY > HIDE_AFTER_SCROLL_Y) {
    showTopNav.value = false
  }

  // Scrolling up
  if (delta < 0) {
    showTopNav.value = true
  }

  lastScrollY.value = currentY
}

watch(showMobileMenu, isOpen => {
  if (isOpen) showTopNav.value = true
})

onMounted(() => {
  lastScrollY.value = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Route order for determining slide direction
const routeOrder: Record<string, number> = {
  '/': 0,
  '/missions': 1,
  '/residents': 2,
  '/stores': 3,
}

const slideDirection = ref<'slide-left' | 'slide-right'>('slide-right')

const removeBeforeEach = router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    const fromIndex = routeOrder[from.path] ?? 0
    const toIndex = routeOrder[to.path] ?? 0
    slideDirection.value = toIndex > fromIndex ? 'slide-left' : 'slide-right'
  }
  return true
})

// Get pending counts for navigation badges
const { pendingMissions } = useUserMissionsWithData()
const { completableMissions } = useCompletableMissions()
const residentsStore = useResidentsStore()

const routes = [
  { path: '/', name: 'Dashboard', icon: '📊' },
  { path: '/missions', name: 'Missions', icon: '🎯' },
  { path: '/residents', name: 'Residents', icon: '👥' },
  { path: '/stores', name: 'Stores', icon: '🏪' },
]

const currentRoute = computed(() => route.path)

watch(
  () => route.path,
  () => {
    showMobileMenu.value = false
  }
)

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showMobileMenu.value = false
  }
}

function handleGlobalPointerDown(event: PointerEvent) {
  if (!showMobileMenu.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  // Close when clicking outside the mobile menu region and menu button.
  if (target.closest('#mobile-menu') || target.closest('[aria-controls="mobile-menu"]')) {
    return
  }
  showMobileMenu.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('pointerdown', handleGlobalPointerDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
  removeBeforeEach()
})

const residentsNeedingPlacementCount = computed(
  () => residentsStore.getResidentsNotInDreamJob().length
)

const pendingCountByPath = computed<Record<string, number>>(() => {
  return {
    '/missions': pendingMissions.value.length,
    '/residents': residentsNeedingPlacementCount.value,
    '/': completableMissions.value.length + residentsNeedingPlacementCount.value,
  }
})

function getPendingCount(path: string): number {
  return pendingCountByPath.value[path] ?? 0
}

function handleNavClick(path: string) {
  router.push(path)
  showMobileMenu.value = false
}
</script>
