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
yarn
```

2. Run development server:

```bash
yarn dev
```

3. Build for production:

```bash
yarn build
```

## Code Quality

The project uses ESLint and Prettier for code quality and formatting:

- **Lint code**: `yarn lint` - Runs ESLint and auto-fixes issues
- **Format code**: `yarn format` - Formats all files with Prettier
- **Check formatting**: `yarn format:check` - Checks if files are formatted correctly

You can customize the rules in `eslint.config.mjs` and `.prettierrc` files.

## Deployment

The app is configured for Netlify deployment. The `netlify.toml` file includes the necessary build configuration and redirect rules for SPA routing.

## Optional: Cloud OCR (Google Vision)

The Residents screenshot importer can fall back to Google Vision OCR (via a Netlify Function) when on-device OCR finds too few rows.

**Netlify environment variable**

- `GOOGLE_VISION_API_KEY`: A Google Cloud Vision API key with access to the Vision API.

**Setup links**

- Google Cloud Vision API (enable in your project): https://console.cloud.google.com/apis/library/vision.googleapis.com
- Google Cloud API keys (create credentials): https://console.cloud.google.com/apis/credentials
- Netlify environment variables (docs + UI path): https://docs.netlify.com/configure-builds/environment-variables/

**How it works**

- Client calls `/.netlify/functions/google-vision-ocr` (no API key exposed to the browser)
- Function calls Google Vision `DOCUMENT_TEXT_DETECTION` and returns OCR lines/text

If `GOOGLE_VISION_API_KEY` is not set, the app will silently continue using local OCR only.

### Local development (Netlify Functions)

To test cloud OCR locally, run the app via Netlify Dev so `/.netlify/functions/*` endpoints work.

Create a local env file so the function has access to your API key:

```bash
cp .env.example .env
```

Then set `GOOGLE_VISION_API_KEY` in `.env`.

1. Install Netlify CLI:

```bash
yarn global add netlify-cli
```

2. Run Netlify Dev (this will run Vite and the functions):

```bash
netlify dev
```

Then open the URL it prints (typically `http://localhost:8888`).

## Data Files

- `public/db-mission.json`: Contains all legacy missions from Tiny Tower Classic
- `public/db-store.json`: Contains all stores available in the game

## Usage

1. **Add Stores**: Go to the Stores page and add stores you've built in the game
2. **Add Residents**: Go to the Residents page and add residents with their dream jobs
3. **Add Missions**: Go to the Missions page and add missions you want to track
4. **View Dashboard**: Check the Dashboard for pending changes and suggestions

All data is automatically saved to localStorage and persists between sessions.
