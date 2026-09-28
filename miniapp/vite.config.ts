import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore local development middleware
import framePreview from '../scripts/serve-frame.mjs'

export default defineConfig({ plugins: [react(), framePreview()], base: './' })
