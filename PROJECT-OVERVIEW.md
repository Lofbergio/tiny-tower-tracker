# Tiny Tower Tracker - Project Overview

**Last Updated:** December 14, 2025

## Overview

Tiny Tower Tracker is a Vue 3 + TypeScript single-page application (SPA) designed to help players manage their Tiny Tower Classic mobile game. It tracks missions, stores, residents, and provides intelligent suggestions for optimal tower management.

## Tech Stack

### Core Framework

- **Vue 3.4.21** - Composition API with `<script setup>`
- **TypeScript 5.4.5** - Full type safety throughout the codebase
- **Vite 5.2.0** - Build tool and dev server
- **Vue Router 4.3.0** - Client-side routing with HTML5 history mode

### State Management

- **Pinia 3.0.4** - Vue's official state management library
- **TanStack Query (Vue Query) 5.92.1** - Server state management for fetching and caching static data (stores and missions)
- **LocalStorage** - Persistent data storage for all user data

### UI & Styling

- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix Vue 1.9.0** - Unstyled, accessible UI primitives
- **@radix-icons/vue** - Icon library
- **tailwindcss-animate** - Animation utilities

### Utilities

- **VueUse (@vueuse/core 10.11.0)** - Collection of Vue Composition utilities (particularly `useDebounceFn`)
- **Zod 4.1.13** - Schema validation for data integrity

### Code Quality

- **ESLint 9** - Linting with TypeScript and Vue plugins
- **Prettier 3.2.5** - Code formatting with Tailwind plugin
- **vue-tsc 2.0.6** - TypeScript type checking for Vue files

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── App.vue                    # Root component with navigation
├── router.ts                  # Route configuration
├── style.css                  # Global styles and Tailwind imports
├── components/                # Reusable components
│   ├── DataManagement.vue     # Import/export/reset functionality
│   ├── EmptyTowerIllustration.vue
│   ├── ErrorBoundary.vue      # Error handling wrapper
│   ├── MissionCard.vue        # Display individual mission
│   ├── PendingChanges.vue     # Dashboard suggestions component
│   ├── ResidentCard.vue       # Display individual resident
│   ├── StoreCard.vue          # Display individual store
│   ├── StoreIcon.vue          # Category-based store icons
│   ├── TowerIllustration.vue  # Decorative tower graphic
│   └── ui/                    # Radix-based UI primitives
│       ├── Badge.vue
│       ├── Button.vue
│       ├── Card.vue
│       ├── ConfirmDialog.vue
│       ├── DarkModeToggle.vue
│       ├── Dialog.vue
│       ├── DialogContent.vue
│       ├── DialogTitle.vue
│       ├── EmptyState.vue
│       ├── Input.vue
│       ├── Label.vue
│       ├── SearchableSelect.vue  # Searchable dropdown for stores
│       ├── Select.vue
│       ├── SelectItem.vue
│       ├── Tabs.vue
│       ├── TabsContent.vue
│       ├── TabsList.vue
│       ├── TabsTrigger.vue
│       └── Toast.vue
├── composables/               # Reusable composition functions
│   ├── useConfirmDialog.ts    # Confirmation dialog state management
│   └── useDarkMode.ts         # Dark mode toggle with localStorage
├── constants/
│   └── index.ts               # App-wide constants
├── queries/
│   └── index.ts               # TanStack Query hooks for data fetching
├── stores/                    # Pinia stores
│   └── index.ts               # All stores: app, residents, stores, missions
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   ├── categoryColors.ts      # Store category color mapping
│   ├── missionMatcher.ts      # Logic for determining completable missions
│   ├── storage.ts             # Import/export/quota management
│   ├── toast.ts               # Toast notification utilities
│   └── validation.ts          # Zod schemas and validators
└── views/                     # Page components
    ├── Dashboard.vue          # Main overview with pending changes
    ├── Missions.vue           # Mission tracking page
    ├── Residents.vue          # Resident management page
    └── Stores.vue             # Store management page
```

## Data Architecture

### Type System (`src/types/index.ts`)

#### Core Game Data Types (Static)

```typescript
interface Mission {
  id: string
  name: string
  description: string
  requirements: MissionRequirement[]
  reward: number
}

interface MissionRequirement {
  product: string
  quantity: number
  store: string // Store name, not ID
}

interface Store {
  id: string
  name: string
  category: string
  products: string[]
}
```

#### User Data Types (Dynamic)

```typescript
interface UserStore {
  storeId: string // References Store.id
  residents: string[] // Array of Resident.id (max 3)
}

interface Resident {
  id: string // Numeric ID as string
  name: string // Validated: 1-50 chars, alphanumeric + spaces/'-
  dreamJob: string // References Store.id
}

interface UserMission {
  missionId: string // References Mission.id
  status: 'pending' | 'completed'
  addedAt: number // Timestamp
}

interface UserData {
  stores: UserStore[]
  residents: Resident[]
  missions: UserMission[]
}
```

### Data Sources

#### Static Data (Cached Forever)

- **`public/db-store.json`** - All available stores in the game (~100 stores)
- **`public/db-mission.json`** - All legacy missions (~150 missions)

These are fetched once on app load via TanStack Query with `staleTime: Infinity` and `gcTime: Infinity`.

#### User Data (LocalStorage)

- **Key:** `tiny-tower-tracker-data`
- **Format:** JSON stringified `UserData`
- **Persistence:** Auto-saved with debounced writes (500ms delay)
- **Validation:** All data validated with Zod schemas on load/save
- **Migration:** Automatic data migrations happen on load (e.g., removing deprecated fields, converting old IDs)

## State Management

### Pinia Stores (`src/stores/index.ts`)

The application uses 4 Pinia stores:

#### 1. **useAppStore** - Root data store

- Manages the entire `UserData` object
- Handles localStorage load/save operations
- Implements debounced saving (500ms delay)
- Performs data migrations and cleanup on load
- Validates data integrity using Zod schemas
- Provides import/export/reset functionality

**Key Methods:**

- `loadData()` - Load from localStorage with migrations
- `saveData()` - Immediate save to localStorage
- `saveDataDebounced()` - Debounced save (used by other stores)
- `importData(newData)` - Import and validate external data
- `resetData()` - Clear all user data

**Data Migrations:**

- Removes deprecated `currentStore` field from residents
- Converts non-numeric resident IDs to numeric
- Cleans up completed missions older than 30 days

#### 2. **useResidentsStore** - Resident management

- CRUD operations for residents
- Resident placement tracking
- Dream job matching logic

**Key Methods:**

- `addResident(name, dreamJob)` - Create with auto-incrementing numeric ID
- `removeResident(residentId)` - Also removes from stores
- `updateResident(residentId, updates)` - Partial updates
- `getCurrentStore(residentId)` - Find which store they're in
- `getResidentsNotInDreamJob()` - Find misplaced residents
- `getResidentsForStore(storeId)` - Find residents with matching dream job

#### 3. **useStoresStore** - Store management

- CRUD operations for user stores
- Resident assignment (max 3 per store)
- Capacity tracking

**Key Methods:**

- `addStore(storeId)` - Add a store to user's tower
- `removeStore(storeId)` - Remove store
- `addResidentToStore(storeId, residentId)` - Assign resident (auto-removes from previous store)
- `removeResidentFromStore(storeId, residentId)` - Unassign resident
- `getStoreCapacity(storeId)` - Current count
- `isStoreFull(storeId)` - Check if at capacity (3)

#### 4. **useMissionsStore** - Mission tracking

- Mission status management
- Auto-cleanup of old completed missions

**Key Methods:**

- `addMission(missionId)` - Add mission to track
- `markMissionCompleted(missionId)` - Change status
- `markMissionPending(missionId)` - Revert status
- `removeMission(missionId)` - Delete from tracking

### TanStack Query (`src/queries/index.ts`)

Handles fetching and caching of static game data:

#### Query Hooks

**`useStoresQuery()`**

- Fetches `db-store.json`
- 10-second timeout
- Cached forever

**`useMissionsQuery()`**

- Fetches `db-mission.json`
- 10-second timeout
- Cached forever

#### Computed Query Hooks (Join User + Static Data)

**`useUserStoresWithData()`**

- Joins `userStores` with full `Store` objects
- Returns: `{ userStores, allStores, isLoading }`

**`useUserMissionsWithData()`**

- Joins `userMissions` with full `Mission` objects
- Returns: `{ allMissions, userMissions, pendingMissions, completedMissions, isLoading }`

**`useCompletableMissions()`**

- Computes which pending missions can be completed
- Returns: `{ completableMissions, isMissionCompletable(missionId) }`

## Business Logic

### Mission Matching (`src/utils/missionMatcher.ts`)

**Algorithm:**

```typescript
canCompleteMission(mission, userStores, allStores): boolean
```

For each mission requirement:

1. Find the store definition that produces the required product
2. Check if user has built that store
3. Verify the store actually produces that product

All requirements must be satisfied for a mission to be completable.

**Note:** Resident staffing is NOT required - only store presence matters.

### Validation (`src/utils/validation.ts`)

Uses Zod schemas for runtime validation:

**Resident Validation:**

- Name: 1-50 characters, alphanumeric + spaces/hyphens/apostrophes
- Dream job: Non-empty string (store ID)
- ID: String (numeric recommended)

**UserStore Validation:**

- storeId: String
- residents: Array of strings, max length 3

**UserMission Validation:**

- missionId: String
- status: Enum ('pending' | 'completed')
- addedAt: Number (timestamp)

### Storage Management (`src/utils/storage.ts`)

**Export:**

- Creates JSON file with timestamp: `tiny-tower-backup-YYYY-MM-DD.json`
- Pretty-printed JSON (2-space indent)

**Import:**

- FileReader API
- Validates with Zod before applying
- Rejects invalid data

**Quota Check:**

- Estimates localStorage usage
- Assumes 5MB browser limit (conservative)
- Warns at 90% capacity

### Category Colors (`src/utils/categoryColors.ts`)

Each store category has theme-aware colors:

- Food, Service, Recreation, Retail, Creative
- Returns `{ bg: string, border: string, text: string, icon: string }`
- Dark mode support

## Views & Features

### Dashboard (`src/views/Dashboard.vue`)

**Purpose:** Central hub showing actionable insights

**Features:**

1. **First-time experience** - Onboarding for empty towers
2. **Data management** - Import/export/reset controls
3. **Pending changes** - Smart suggestions component

**Components:**

- `DataManagement.vue` - Full data lifecycle controls
- `PendingChanges.vue` - Shows:
  - Completable missions
  - Residents needing placement in dream jobs
  - Overcapacity warnings (dream job store full)
  - New store opportunities (based on resident dream jobs)

### Stores (`src/views/Stores.vue`)

**Purpose:** Manage tower stores and resident assignments

**Features:**

1. **Add stores** - Browse all available stores, filter by category
2. **View user stores** - Grid of built stores
3. **Manage residents** - Assign/remove up to 3 per store
4. **Category filtering** - Food, Service, Recreation, Retail, Creative
5. **Search** - Filter stores by name

**Key Components:**

- `StoreCard.vue` - Shows store details, residents, actions
- `SearchableSelect.vue` - Used for resident assignment

### Residents (`src/views/Residents.vue`)

**Purpose:** Manage tower residents and their dream jobs

**Features:**

1. **Add residents** - Name + dream job selection
2. **View all residents** - Grid display with placement status
3. **Quick placement** - "Place in Dream Job" button
4. **Status indicators:**
   - ✅ In dream job
   - ⚠️ Dream job store full
   - 📍 In wrong store
   - Not assigned

**Key Components:**

- `ResidentCard.vue` - Shows resident details, current placement, actions

### Missions (`src/views/Missions.vue`)

**Purpose:** Track mission progress

**Features:**

1. **Browse missions** - Search and filter by completion status
2. **Add missions** - Track missions you want to complete
3. **Status tracking** - Mark as completed/pending
4. **Completion indicators:**
   - ✅ Can complete now (have required stores)
   - 🔒 Cannot complete (missing stores)
5. **Tabs:** All, Pending, Completed

**Key Components:**

- `MissionCard.vue` - Shows requirements, rewards, completion status

## App-wide Features

### Navigation (`src/App.vue`)

**Desktop:**

- Sticky top navbar with route buttons
- Badge indicators showing pending counts
- Dark mode toggle

**Mobile:**

- Fixed bottom navigation (4 tabs)
- Hamburger menu for additional options
- Optimized touch targets

**Badge Counts:**

- Dashboard: Completable missions + misplaced residents
- Missions: Pending missions count
- Residents: Residents not in dream job
- Stores: No badge

### Dark Mode (`src/composables/useDarkMode.ts`)

- Toggle via `DarkModeToggle.vue` component
- Syncs with system preference on first visit
- Persists to localStorage: `tiny-tower-tracker-theme`
- Applies/removes `dark` class on `<html>` element
- Tailwind dark mode: class-based

### Error Handling (`src/components/ErrorBoundary.vue`)

- Catches Vue component errors
- Prevents full app crashes
- Shows friendly error message
- Logs errors to console

### Toast Notifications (`src/utils/toast.ts`)

Global notification system:

- Success/error/info variants
- Auto-dismiss after 3 seconds
- Custom messages
- Used throughout CRUD operations

### Confirm Dialogs (`src/composables/useConfirmDialog.ts`)

Reusable confirmation pattern:

- Generic confirmation state management
- Supports different variants (destructive, default)
- Used for delete operations

## Constants (`src/constants/index.ts`)

```typescript
APP_CONSTANTS = {
  MAX_STORE_CAPACITY: 3,
  STORAGE_KEY: 'tiny-tower-tracker-data',
  THEME_STORAGE_KEY: 'tiny-tower-tracker-theme',
  FIRST_VISIT_KEY: 'tiny-tower-has-visited',
  STORES_DATA_URL: '/db-store.json',
  MISSIONS_DATA_URL: '/db-mission.json',
  MAX_RESIDENT_NAME_LENGTH: 50,
  MIN_RESIDENT_NAME_LENGTH: 1,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 500,
  LOCAL_STORAGE_ESTIMATED_LIMIT: 5 * 1024 * 1024,
  QUERY_KEYS: { STORES: 'stores', MISSIONS: 'missions' },
}
```

## Data Flow Examples

### Adding a Resident

1. User opens dialog in Residents view
2. Enters name and selects dream job from searchable dropdown
3. Clicks "Add Resident"
4. `residentsStore.addResident(name, dreamJob)` called
5. Validation runs (Zod schema)
6. New resident created with auto-incremented numeric ID
7. Added to `appStore.data.residents`
8. `appStore.saveDataDebounced()` called
9. After 500ms, saved to localStorage
10. UI updates reactively via Pinia computed properties
11. Success toast shown

### Completing a Mission

1. User builds required stores
2. Dashboard shows mission in "Missions Ready to Complete"
3. User clicks "Mark Done" or navigates to Missions view
4. `missionsStore.markMissionCompleted(missionId)` called
5. Mission status changed to 'completed'
6. `appStore.saveDataDebounced()` called
7. Mission moves to "Completed" tab
8. Badge count decrements
9. Success toast shown

### Placing a Resident in Dream Job

1. Resident's dream job is "Sushi Bar" (store ID: "sushi-bar")
2. User has built Sushi Bar
3. Dashboard/Residents view shows suggestion
4. User clicks "Place Here"
5. `storesStore.addResidentToStore('sushi-bar', residentId)` called
6. Function checks capacity (< 3)
7. Removes resident from any previous store
8. Adds resident to new store's residents array
9. `appStore.saveDataDebounced()` called
10. UI updates showing resident in correct store
11. Suggestion removed from dashboard
12. Success toast shown

## Performance Optimizations

1. **Debounced Saves** - 500ms delay prevents excessive localStorage writes
2. **Vue Query Caching** - Static data fetched once, cached forever
3. **Computed Properties** - All derived state calculated reactively
4. **Component Lazy Loading** - Could be added for routes (not currently implemented)
5. **LocalStorage Quota Checks** - Prevents exceeding browser limits
6. **Efficient Filtering** - Client-side search/filter for fast UX

## Build & Deployment

### Development

```bash
yarn dev          # Start Vite dev server
yarn lint         # ESLint with auto-fix
yarn format       # Prettier formatting
```

### Production

```bash
yarn build        # TypeScript type check + Vite build
yarn preview      # Preview production build
```

### Deployment (Netlify)

- `netlify.toml` configured for SPA routing
- Redirects all routes to `index.html`
- Build command: `yarn build`
- Publish directory: `dist`

## Browser Compatibility

- **Modern browsers only** (ES2020+)
- Uses: LocalStorage, FileReader, Fetch API, CSS Grid/Flexbox
- Dark mode via CSS `prefers-color-scheme` media query
- Responsive design: Mobile-first with Tailwind breakpoints

## Known Limitations & Design Decisions

1. **No Backend** - Entirely client-side, data in localStorage only
2. **No User Accounts** - Single-user per browser/device
3. **No Real-time Sync** - No cloud backup (manual export/import only)
4. **Static Game Data** - Missions/stores hardcoded in JSON files
5. **Resident Capacity** - Hardcoded to 3 per store (game rule)
6. **Mission Completion** - Only checks store presence, not actual stock
7. **No Analytics** - Privacy-first, no tracking
8. **No Authentication** - No login required

## Future Enhancement Opportunities

1. Cloud sync with optional accounts
2. PWA (Progressive Web App) for offline use
3. Push notifications for completable missions
4. Stats/analytics dashboard
5. Mission recommendations based on current stores
6. Undo/redo functionality
7. Multi-tower support (multiple save slots)
8. VIP tracking
9. Roof management
10. Floor ordering/organization

## Testing Notes

Currently **no automated tests** are implemented. Manual testing covers:

- CRUD operations for all entities
- Data persistence across page reloads
- Import/export functionality
- Dark mode toggle
- Mobile responsive design
- Error handling and validation

## Development Tips for AI Agents

### When Adding Features

1. Always update TypeScript types first in `src/types/index.ts`
2. Add validation schemas in `src/utils/validation.ts`
3. Implement store logic in `src/stores/index.ts`
4. Create/update views in `src/views/`
5. Add constants to `src/constants/index.ts`
6. Update this documentation

### Code Style Preferences

- Use Composition API with `<script setup>`
- Prefer `const` over `let`
- Use TypeScript strict mode
- Extract reusable logic to composables
- Keep components focused and single-purpose
- Use Tailwind utilities over custom CSS
- Follow Vue 3 best practices
- Use Radix Vue for accessible components

### Common Patterns

**Computed State from Stores:**

```typescript
const { residents } = useResidentsStore()
const currentStore = computed(() => residentsStore.getCurrentStore(residentId))
```

**Debounced Save:**

```typescript
appStore.saveDataDebounced() // Use this in stores
```

**Toast Notifications:**

```typescript
const toast = useToast()
toast.success('Mission completed!')
toast.error('Store is full')
```

**Confirm Dialogs:**

```typescript
const { confirm } = useConfirmDialog()
const confirmed = await confirm({
  title: 'Delete Resident?',
  message: 'This action cannot be undone',
  variant: 'destructive',
})
if (confirmed) {
  /* do delete */
}
```

## Key Files to Review First

When joining this project or debugging issues, review these files in order:

1. `src/types/index.ts` - Understand data structures
2. `src/stores/index.ts` - Core business logic
3. `src/queries/index.ts` - Data fetching patterns
4. `src/constants/index.ts` - App configuration
5. `src/App.vue` - Navigation and layout
6. `src/views/Dashboard.vue` - Main user flow

---

**Project Maintained By:** AI-assisted development  
**License:** MIT  
**Game:** Tiny Tower Classic (by NimbleBit)
