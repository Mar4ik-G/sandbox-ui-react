import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    origin: 'https://c2e6c91cd8d0.ngrok-free.app',
  }
})
