/**
 * Test Setup File
 * JavaScript testing environment setup for Jest
 */

// Setup DOM environment
require('jsdom-global')();

// Setup console for tests
global.console = {
  ...console,
  // Uncomment to ignore console outputs in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup fetch mock
global.fetch = jest.fn();

// Setup localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Setup sessionStorage mock
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Apply mocks to global
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Setup window object for browser environment
global.window = global.window || {};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage/sessionStorage mocks
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  
  // Reset fetch mock
  global.fetch.mockClear();
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});