import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Run in a non-UTC zone with DST so tests catch any dependence on the host timezone
    env: { TZ: 'Europe/Berlin' },
  },
});
