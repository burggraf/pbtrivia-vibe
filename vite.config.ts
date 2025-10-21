import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: ['**/pocketbase', '**/pocketbase_*.zip', '**/CHANGELOG.md', '**/LICENSE.md', '**/pb_data/**', '**/pocketbase.log']
    }
  },
  optimizeDeps: {
    exclude: ['pocketbase']
  }
})