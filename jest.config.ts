import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 90,
      lines: 95,
      statements: 95
    }
  },
  resetMocks: true,
  clearMocks: true
};

export default config;
