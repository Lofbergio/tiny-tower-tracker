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

## Before You Start

1. Read `PROJECT-OVERVIEW.md` for full context
2. Check `src/types/index.ts` to understand data structures
3. Review `src/stores/index.ts` for business logic
4. Follow existing patterns and conventions

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
