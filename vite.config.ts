import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages配信時はワークフローが KEIGO_BASE=/keigo/ を与える
  base: process.env.KEIGO_BASE ?? '/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
