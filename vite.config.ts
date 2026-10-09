/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // os testes de tela digitam campo a campo em jsdom: com vários arquivos em paralelo passam fácil de 5 s
    testTimeout: 20000,
  },
})
