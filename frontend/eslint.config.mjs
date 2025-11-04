import tslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import tsparser from '@typescript-eslint/parser';
import airBnb from 'eslint-config-airbnb-base';
import airBnbTypescript from 'eslint-config-airbnb-typescript';
import prettier from 'eslint-plugin-prettier';

export default tslint.config(...tslint.configs.recommendedTypeChecked, eslintConfigPrettier, {
  plugins: {
    airBnb,
    airBnbTypescript,
    prettier
  },
  languageOptions: {
    parser: tsparser
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'none'
      }
    ],
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-console': 'warn' // Changed from 'error' to 'off' to allow console log
  },
  files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
  ignores: ['.gen-cli/'],
  extends: [tslint.configs.disableTypeChecked]
});
