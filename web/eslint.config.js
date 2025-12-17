import pluginVue from 'eslint-plugin-vue';
import typescript from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // TypeScript files
  ...typescript.configs.recommended,

  // Vue files
  ...pluginVue.configs['flat/recommended'],

  // Vue + TypeScript parser
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescript.parser,
      },
    },
  },

  // Custom rules
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Prettier compatibility (must be last)
  eslintConfigPrettier,
];
