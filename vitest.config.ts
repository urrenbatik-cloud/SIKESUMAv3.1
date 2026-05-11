import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Vitest configuration — Tier 3 Phase 2b.
 *
 * Extends vite.config.ts (so path aliases @/ resolve correctly) with test runner
 * overrides. Target: 'node' environment karena recommender adalah pure logic
 * (tidak butuh DOM). Saat Tier 4+ butuh testing UI components, bisa add
 * happy-dom atau jsdom di config terpisah.
 *
 * Run: `npm test` (single run) atau `npm run test:watch` (watch mode).
 */
export default mergeConfig(
  viteConfig({ mode: 'test' } as any),
  defineConfig({
    test: {
      environment: 'node',
      globals: false,                          // explicit imports (clearer DX)
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
      ],
      // Coverage opsional — bisa di-enable nanti dengan @vitest/coverage-v8
      reporters: ['default'],
    },
  })
);
