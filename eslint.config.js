module.exports = {
  extends: [
    'next/core-web-vitals',
    '@next/eslint-config-next'
  ],
  rules: {
    // Custom rules if needed
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    '*.config.js'
  ]
}
