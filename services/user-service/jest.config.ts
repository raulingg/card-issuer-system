export default {
  displayName: 'user-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc-node/jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/services/user-service',
  moduleNameMapper: {
    '^@libs/common(.*)$': '<rootDir>/../../libs/common/src$1',
    '^@libs/kafka(.*)$': '<rootDir>/../../libs/kafka/src$1',
    '^@libs/database(.*)$': '<rootDir>/../../libs/database/src$1',
    '^@libs/config(.*)$': '<rootDir>/../../libs/config/src$1',
  },
};
