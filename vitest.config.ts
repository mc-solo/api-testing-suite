import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 30000,
    reporters: ['default'],
    include: ['tests/**/*.test.ts'],
  },
});
