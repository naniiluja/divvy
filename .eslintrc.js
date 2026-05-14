module.exports = {
  extends: ['expo', 'eslint:recommended'],
  plugins: [],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/array-type': ['warn', { default: 'array' }],
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'web-build/', 'supabase/functions/'],
}
