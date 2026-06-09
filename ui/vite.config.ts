import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5101,
    proxy: {
      '/api': {
        target: 'https://localhost:7130',
        secure: false,
      },
    },
  },
})
