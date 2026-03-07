export default [
  {
    files: ['.github/webapp/**/*.js'],
    ignores: ['**/*.test.js', '**/node_modules/**'],
    rules: {
      complexity: ['error', { max: 8 }],
    },
  },
];
