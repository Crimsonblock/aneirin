import type { Config } from 'jest';
import { defaults } from 'jest-config';

var config: Config = {
  transform: { '^.+\\.m?ts?$': ['ts-jest', { tsConfig: "tsconfig.test.json" }] },
  testEnvironment: 'node',
  testRegex: 'test/.*\\.(test|spec)?\\.(ts|tsx|mts)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', "mts"],
  moduleNameMapper: {
    "^(\\.\\/.+)\\.m?js$": "$1"
  }
};

export default config;