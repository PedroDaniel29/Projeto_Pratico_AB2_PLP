import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import rxjs from 'eslint-plugin-rxjs-x';

const subjectSelector =
  "NewExpression[callee.name=/^(Subject|BehaviorSubject|ReplaySubject|AsyncSubject)$/]";

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'rxjs-x': rxjs },
    rules: {
      // Qualidade geral
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',

      // Regras de Programação Reativa (ver docs/ARCHITECTURE.md)
      'rxjs-x/no-nested-subscribe': 'error',
      'rxjs-x/no-async-subscribe': 'error',
      'rxjs-x/no-ignored-subscription': 'error',
      'rxjs-x/no-ignored-error': 'error',
      'rxjs-x/no-exposed-subjects': 'error',
      'rxjs-x/no-unsafe-takeuntil': 'error',
      'rxjs-x/no-subject-unsubscribe': 'error',
      'rxjs-x/no-unsafe-subject-next': 'error',
      'rxjs-x/no-floating-observables': 'error',
    },
  },
  {
    // Subjects só podem ser criados na camada infra (encapsulados).
    files: ['src/domain/**/*.ts', 'src/streams/**/*.ts', 'src/app/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: subjectSelector,
          message: 'Subjects só podem ser criados em src/infra (encapsule e exponha Observable).',
        },
      ],
    },
  },
);
