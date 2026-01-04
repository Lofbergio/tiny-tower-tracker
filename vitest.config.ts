import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Use jsdom for component tests, node for unit tests
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    // Needed for Radix Vue components
    deps: {
      inline: ['radix-vue'],
    },
  },
})
