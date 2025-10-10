/**
 * Test Configuration for PeerSupportHub
 * Following MIT 6.102 Testing principles - JavaScript Only
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directory
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['js', 'json'],
  
  // No TypeScript transform needed
  transform: {},
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@scripts/(.*)$': '<rootDir>/src/scripts/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/scripts/**/*.js',
    'server/**/*.js',
    '!src/scripts/**/*.test.js',
    '!server/**/*.test.js'
  ],
  
  // Coverage thresholds (MIT 6.102 standard: high coverage)
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Mock CSS and other assets
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Global test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true
};