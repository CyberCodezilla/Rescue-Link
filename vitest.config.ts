import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'packages/**/*.test.ts',
      'apps/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@rescue-link/schema': path.resolve(__dirname, './packages/schema/src'),
      '@rescue-link/config': path.resolve(__dirname, './packages/config/src'),
      '@': path.resolve(__dirname, './apps/survivor-web/src'),
      '@responder': path.resolve(__dirname, './apps/responder-web/src'),
    },
  },
});
