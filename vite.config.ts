import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/studyapp/',
  build: {
    // Generate source maps for better debugging
    sourcemap: false,
    // Ensure assets get unique names on each build
    rollupOptions: {
      output: {
        // Add timestamp-based naming for better cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
