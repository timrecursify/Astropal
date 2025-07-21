module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'next/core-web-vitals',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    worker: true
  },
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // General code quality
    'no-console': 'warn', // Prefer structured logging
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-expressions': 'error',
    'no-duplicate-imports': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Performance
    'no-loop-func': 'error',
    'no-nested-ternary': 'warn',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-return-assign': 'error',
    'no-useless-return': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // Import ordering
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
      'allowSeparatedGroups': true
    }]
  },
  overrides: [
    {
      // Backend-specific rules
      files: ['packages/backend/**/*.ts'],
      env: {
        browser: false,
        node: false,
        worker: true
      },
      rules: {
        'no-console': 'off', // Allow console in backend with structured logging
        '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }]
      }
    },
    {
      // Frontend-specific rules
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals'],
      rules: {
        'react/no-unescaped-entities': 'off',
        'react/prop-types': 'off',
        'react-hooks/exhaustive-deps': 'warn'
      }
    },
    {
      // Configuration files
      files: ['*.config.{js,ts}', '.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '.wrangler/',
    'coverage/',
    '*.min.js'
  ]
}; 