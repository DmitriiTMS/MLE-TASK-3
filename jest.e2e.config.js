module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.e2e.ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage/e2e',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testTimeout: 30000,
    resetModules: false,
};