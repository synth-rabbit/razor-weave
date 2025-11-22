import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Plugin to serve styles and scripts from src/ directories
function serveFromSrc() {
  return {
    name: 'serve-from-src',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Rewrite /styles/* to src/styles/*
        if (req.url.startsWith('/styles/')) {
          const filePath = resolve(__dirname, 'src', req.url.slice(1))
          if (fs.existsSync(filePath)) {
            req.url = '/src' + req.url.slice(0)
            return next()
          }
        }
        // Rewrite /scripts/* to src/scripts/*
        if (req.url.startsWith('/scripts/')) {
          const filePath = resolve(__dirname, 'src', req.url.slice(1))
          if (fs.existsSync(filePath)) {
            req.url = '/src' + req.url.slice(0)
            return next()
          }
        }
        next()
      })
    }
  }
}

export default defineConfig({
  root: 'src/pages',
  publicDir: '../../public',
  plugins: [serveFromSrc()],
  server: {
    port: 3000,
    open: '/index.html',
    fs: {
      // Allow serving files from src directory (styles, scripts)
      allow: ['..']
    }
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
})
