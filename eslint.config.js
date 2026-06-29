import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Flat config for ESLint v9+
export default [
  // Ignore build artifacts and deps
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.vite/**'] },

  // Base TypeScript + browser config
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Keep initial rules minimal; expand as needed
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // React recommended ruleset
  pluginReactConfig,

  // TypeScript React files use the automatic JSX runtime and TS typing
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  // Test files: add jest globals
  {
    files: ['**/*.test.tsx', '**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        screen: 'readonly',
        waitFor: 'readonly',
      },
    },
  },
];
