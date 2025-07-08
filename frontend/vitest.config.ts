import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/app/components/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
});