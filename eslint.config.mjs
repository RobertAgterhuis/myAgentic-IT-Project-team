export default [
  {
    files: ['.github/webapp/**/*.js'],
    ignores: ['**/*.test.js', '**/node_modules/**'],
    rules: {
      complexity: ['error', { max: 8 }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
];
