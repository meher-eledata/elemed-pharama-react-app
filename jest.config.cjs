// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'jsdom',
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
//   // This explicitly sets the root directory for Jest
//   rootDir: '.', // This should be the path to your project root
//   moduleNameMapper: {
//     '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
//     // Now Jest will correctly resolve this path relative to the root
//     '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
//   },
//   transform: {
//     '^.+\\.(ts|tsx)$': 'ts-jest'
//   },
// };

const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Use the <rootDir> alias to ensure the path is always correct
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    // Use preprocessor to replace import.meta.env before ts-jest compilation
    '^.+\\.(ts|tsx)$': path.resolve(__dirname, 'jest.preprocessor.cjs'),
  },
  // Ignore the stale .worktrees/ checkout: without this, Jest double-collects
  // every suite (once from src, once from the worktree copy) and warns about
  // duplicate manual mocks (fileMock). modulePathIgnorePatterns silences the
  // haste-map duplicate-mock warning.
  testPathIgnorePatterns: ['/node_modules/', '/.worktrees/'],
  modulePathIgnorePatterns: ['/.worktrees/'],
};
