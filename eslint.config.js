const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');

module.exports = [
    {
        ignores: [
            'dist',
            'node_modules',
            '**/*.d.ts',
        ],
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                node: true,
                es2022: true,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: prettier,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...tseslint.configs['recommended-requiring-type-checking'].rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    'checksVoidReturn': false,
                    'checksConditionals': true,
                }
            ],
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            'no-console': 'warn',
            'prettier/prettier': [
                'error',
                {
                    semi: true,
                    trailingComma: 'all',
                    singleQuote: true,
                    printWidth: 100,
                    endOfLine: 'auto',
                    useTabs: true,
                    tabWidth: 2,
                    bracketSpacing: true,
                    arrowParens: 'always',
                },
            ],
        },
    },
    {
        files: ['**/*.spec.ts', '**/*.test.ts'],
        rules: {
            'no-console': 'off',
        },
    },
];