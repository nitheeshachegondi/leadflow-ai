import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react()],
  css: {
    // Explicitly point PostCSS to the project root so it finds
    // postcss.config.js (and therefore tailwind.config.js) correctly
    // on both Windows and Unix
    postcss: __dirname
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
})
