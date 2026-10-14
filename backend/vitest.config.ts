import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Production containers run in UTC; match that so date math is deterministic
    env: { TZ: 'UTC' },
    restoreMocks: true,
  },
});
