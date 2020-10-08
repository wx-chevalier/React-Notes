module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '\\.(eot|gif|jpe?g|png|svg|ttf|woff2?)$': '<rootDir>/scripts/jest/fileMock.js',
    '\\.(css|less)$': '<rootDir>/scripts/jest/styleMock.js'
  },
  setupFiles: ['<rootDir>/scripts/jest/jest.setup.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  verbose: true,
  collectCoverage: true
};
