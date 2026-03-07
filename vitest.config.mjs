import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      '.github/webapp/**/*.test.js',
      'tests/**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      include: ['.github/webapp/**/*.js'],
      exclude: [
        '.github/webapp/**/*.test.js',
        '.github/webapp/node_modules/**',
        '.github/webapp/start.ps1',
      ],
      reporter: ['text', 'text-summary', 'json-summary', 'json'],
      reportsDirectory: 'coverage',
      thresholds: {
        // Raised by Story #21 (SP-R2-003-002) — server.js 91%+, overall 92%+
        statements: 70,
        branches: 50,
        functions: 70,
        lines: 70,
      },
    },
  },
});
