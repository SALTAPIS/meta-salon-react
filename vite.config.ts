import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { findAvailablePort } from './scripts/port-utils'

// https://vite.dev/config/
export default defineConfig(async () => {
  const port = await findAvailablePort(3000, 3005)

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
    },
  }
})
