import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Listen on all network interfaces
        port: 5173,      // Specify port (optional, 5173 is default)
        strictPort: true, // Exit if port is already in use
    },
    preview: {
        host: '0.0.0.0', // Also for production preview
        port: 4173,
    }
})