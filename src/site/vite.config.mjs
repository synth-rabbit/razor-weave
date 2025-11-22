import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Custom plugin to serve /styles and /scripts from src directories
function serveStaticAssets() {
  return {
    name: 'serve-static-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] // Remove query string

        if (url?.startsWith('/styles/')) {
          const filePath = resolve(__dirname, 'src', url.slice(1))
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/css')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }

        if (url?.startsWith('/scripts/')) {
          const filePath = resolve(__dirname, 'src', url.slice(1))
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/javascript')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }

        if (url?.startsWith('/images/')) {
          const filePath = resolve(__dirname, 'public', url.slice(1))
          if (fs.existsSync(filePath)) {
            const ext = url.split('.').pop()?.toLowerCase()
            const mimeTypes = {
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'svg': 'image/svg+xml',
              'webp': 'image/webp'
            }
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }

        // Serve favicon from public
        if (url === '/favicon.svg') {
          const filePath = resolve(__dirname, 'public/favicon.svg')
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/svg+xml')
            fs.createReadStream(filePath).pipe(res)
            return
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
  plugins: [serveStaticAssets()],
  server: {
    port: 3000,
    open: '/index.html',
    fs: {
      // Allow serving files from entire project
      allow: ['../..']
    }
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  }
})
