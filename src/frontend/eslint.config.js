import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * P0 UI/UX roadmap: lint harness for the plain-JavaScript frontend.
 *
 * Accessibility rules from eslint-plugin-jsx-a11y start as `warn` on purpose: the
 * audit found the UI has effectively no ARIA/keyboard support, so gating on them
 * today would fail every build without helping anyone. The warnings are the measured
 * backlog that phase P7 drives to zero, and P7 promotes them to `error`.
 */
const a11yRules = jsxA11y.flatConfigs.recommended.rules;
const a11yWarnings = Object.fromEntries(
  Object.keys(a11yRules).map((rule) => [rule, 'warn']),
);

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      // Plain-JavaScript project: components document props with JSDoc, not PropTypes.
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      ...a11yWarnings,
    },
  },
];
