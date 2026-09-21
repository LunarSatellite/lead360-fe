import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: [
      'dist',
      'node_modules',
      // Standalone Node smoke scripts run with `node`, not app source: they
      // legitimately use console and require, which the browser config forbids.
      'scripts/**',
      // Agent worktrees under .claude/ are whole checkouts of this repo. Without
      // this every file is linted once per worktree, so one problem is reported N
      // times and the totals stop meaning anything. vitest already excludes these.
      '.claude/**',
    ],
  },
);
