import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    https: {
      cert: fs.readFileSync('./.cert/localhost-cert.pem'),
      key: fs.readFileSync('./.cert/localhost-key.pem'),
    },
  },
})
