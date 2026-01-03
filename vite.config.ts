import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'

function restartOnEnvChange(): Plugin {
  return {
    name: 'restart-on-env-change',
    configureServer(server) {
      const root = server.config.root ?? process.cwd()
      const mode = server.config.mode

      const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`].map(f =>
        path.resolve(root, f)
      )

      const key = (p: string) => {
        const resolved = path.resolve(p)
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved
      }

      const watched = new Set(envFiles.map(key))
      server.watcher.add(envFiles)

      let restartTimer: ReturnType<typeof setTimeout> | null = null
      const requestRestart = (changedPath: string) => {
        if (!watched.has(key(changedPath))) return
        if (restartTimer) clearTimeout(restartTimer)
        restartTimer = setTimeout(() => {
          restartTimer = null
          // Env vars are injected at dev server start; a full reload isn't enough.
          // Restart makes import.meta.env reflect the updated .env file.
          if (typeof (server as any).restart === 'function') {
            ;(server as any).restart()
          } else {
            server.ws.send({ type: 'full-reload' })
          }
        }, 150)
      }

      server.watcher.on('change', requestRestart)
      server.watcher.on('add', requestRestart)
    },
  }
}

export default defineConfig({
  // Force env loading from the repo root (helps when running through wrappers like Netlify Dev).
  envDir: __dirname,
  plugins: [vue(), restartOnEnvChange()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // When running Vite directly (localhost:5173) but Netlify Dev is also running (localhost:8888),
      // proxy Netlify function calls to the Netlify Dev server so functions work.
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
