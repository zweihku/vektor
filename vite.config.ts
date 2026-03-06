import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { apiServerPlugin } from './server/api'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    apiServerPlugin(),
  ],
})
