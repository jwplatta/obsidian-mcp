module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Node environment for server-side testing
  testEnvironment: 'node',

  // Where to find your source and test files
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // exclude entry point if needed
  ],

  // Setup file (optional)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module resolution
  moduleResolution: 'node',

  // Clear mocks between tests
  clearMocks: true,
};