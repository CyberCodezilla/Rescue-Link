import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
        '@responder': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
