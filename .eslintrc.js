module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // MIT 6.102 Best Practices: Code Quality
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Defensive Programming
    'eqeqeq': 'error',
    'no-implicit-globals': 'error',
    'no-undef': 'error',
    
    // Code Clarity 
    'max-len': ['warn', { code: 100 }],
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  },
  globals: {
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    fetch: 'readonly',
    
    // Custom globals for our app
    PeerSupportApp: 'readonly'
  }
};