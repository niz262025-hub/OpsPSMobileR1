import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'coverage/**',
      'test-results/**',
      '.tmp-check-storage.js',
      'mock-shared-db-server.js',
      'mock-shared-server.mjs',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        navigator: 'readonly',
        FileReader: 'readonly',
        Event: 'readonly',
        HTMLInputElement: 'readonly',
        CustomEvent: 'readonly',
        StorageEvent: 'readonly',
        __DEV__: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        localStorage: 'readonly',
        alert: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-native': reactNativePlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-unresolved': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
