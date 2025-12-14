# Tiny Tower Classic Tracker

A tracking application for Tiny Tower Classic to help manage missions, stores, and residents' dream jobs.

## Features

- **Mission Tracking**: Track legacy missions and see which ones can be completed with your current stores
- **Store Management**: Add and manage stores, track which residents are assigned to each store (max 3 per store)
- **Resident Management**: Add residents with their dream jobs and get suggestions for optimal placement
- **Pending Changes Dashboard**: Get suggestions for:
  - Missions that can now be completed
  - Residents that should be placed in stores matching their dream job
  - Overcapacity warnings when stores are full
  - New store opportunities based on residents' dream jobs

## Tech Stack

- Vue 3 + TypeScript
- Tailwind CSS
- shadcn-vue components
- LocalStorage for data persistence

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Code Quality

The project uses ESLint and Prettier for code quality and formatting:

- **Lint code**: `npm run lint` - Runs ESLint and auto-fixes issues
- **Format code**: `npm run format` - Formats all files with Prettier
- **Check formatting**: `npm run format:check` - Checks if files are formatted correctly

You can customize the rules in `eslint.config.mjs` and `.prettierrc` files.

## Deployment

The app is configured for Netlify deployment. The `netlify.toml` file includes the necessary build configuration and redirect rules for SPA routing.

## Data Files

- `public/db-mission.json`: Contains all legacy missions from Tiny Tower Classic
- `public/db-store.json`: Contains all stores available in the game

## Usage

1. **Add Stores**: Go to the Stores page and add stores you've built in the game
2. **Add Residents**: Go to the Residents page and add residents with their dream jobs
3. **Add Missions**: Go to the Missions page and add missions you want to track
4. **View Dashboard**: Check the Dashboard for pending changes and suggestions

All data is automatically saved to localStorage and persists between sessions.
