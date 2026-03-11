const { workspaceRoot } = require('@nx/devkit');
const path = require('path');

module.exports = {
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.[tj]s$': [
      '@swc-node/jest',
      { swcrc: path.join(workspaceRoot, '.swcrc') },
    ],
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/index.ts'],
};
