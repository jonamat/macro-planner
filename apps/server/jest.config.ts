import type { Config } from 'jest';

const config: Config = {
  displayName: 'server',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleNameMapper: {
    '^@macro-calculator/shared$': '<rootDir>/../../packages/shared/src'
  }
};

export default config;
