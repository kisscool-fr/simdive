/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { version } from './package.json';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), mode === 'development' && vueDevTools()].filter(Boolean),
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
