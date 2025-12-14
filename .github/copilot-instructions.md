# GitHub Copilot Instructions for Tiny Tower Tracker

## CRITICAL: Read This First

**Before making ANY changes, suggestions, or answering questions about this project:**

1. **ALWAYS read `PROJECT-OVERVIEW.md` in the root directory first**
2. This file contains complete architecture documentation, data flow, business logic, and development patterns
3. Understanding the project structure will prevent mistakes and ensure consistency

## Quick Reference

- **State Management:** Pinia stores in `src/stores/index.ts` (4 stores: app, residents, stores, missions)
- **Data Fetching:** TanStack Query for static data (stores, missions from JSON files)
- **Validation:** Zod schemas in `src/utils/validation.ts`
- **Persistence:** LocalStorage with debounced saves (500ms)
- **UI Components:** Radix Vue + Tailwind CSS
- **Code Style:** Vue 3 Composition API with `<script setup>`, TypeScript strict mode
- **Package Manager:** Yarn (use `yarn`, not `npm`; e.g. `yarn dev`, `yarn build`, `yarn lint`)

## Before You Start

1. Read `PROJECT-OVERVIEW.md` for full context
2. Check `src/types/index.ts` to understand data structures
3. Review `src/stores/index.ts` for business logic
4. Follow existing patterns and conventions

## Working Style (Important)

- **Default to completing the full sweep.** When the user asks for a change, apply it **everywhere it makes sense across the project**, not just one or two files.
- **Do not pause to ask “should I continue?”** Assume the answer is **yes**.
- **Be fully autonomous by default.** When the user says “fix it” / “fix all the things” / expresses impatience with step-by-step prompts, interpret that as: do the full end-to-end work (find all instances → implement → validate/build) without asking for permission at each intermediate step.
- Only ask a question when the request is **genuinely ambiguous**, has **multiple reasonable interpretations**, or carries **non-trivial risk** (data loss, breaking changes). Otherwise, proceed end-to-end: find all instances → implement → validate/build.
- Prefer creating small, focused components/composables over bloating existing ones.

## User Preferences (Sticky)

- **Single-user app.** Optimize for what the user personally needs day-to-day.
- **Deprioritize screen-reader/a11y-only work.** Do not spend time on ARIA/screen reader tuning or accessibility-only refinements unless it also improves the user's UX (speed, clarity, mobile ergonomics) or prevents real breakage.
- **When the user states a broad preference like this, update these instructions immediately** so it doesnt get lost.

## Common Tasks

- **Adding a feature:** Update types → validation schemas → store logic → views
- **Modifying data structures:** Update `UserData` type and Zod schemas, consider data migrations
- **Creating components:** Use Radix Vue primitives, follow Tailwind conventions
- **State changes:** Always call `appStore.saveDataDebounced()` after mutations

## Code Standards

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use Composition API with `<script setup>`
- Extract reusable logic to composables
- Validate all user input with Zod
- Use Tailwind utilities over custom CSS
- Follow mobile-first responsive design

---

**Remember: Read PROJECT-OVERVIEW.md before making changes!**
