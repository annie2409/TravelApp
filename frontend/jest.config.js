// Next.js-aware Jest config.
// Uses next/jest to wire SWC, CSS modules, and module aliases.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  // Loaded once per test file, after Jest's test framework is installed.
  // We use it to register @testing-library/jest-dom matchers.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
