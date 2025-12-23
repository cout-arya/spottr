import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'react-icons', 'react-hot-toast'],
          utils: ['axios', 'socket.io-client', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Slightly increase limit to suppress remaining minor warnings if any
  }
})
