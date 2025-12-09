// backend/jest.config.cjs
/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    // Look for tests under src/__tests__ with .test.js
    testMatch: ["<rootDir>/src/__tests__/**/*.test.js"],
    moduleFileExtensions: ["js", "json"]
    // No transforms, Node will handle ESM because "type": "module" is set
};
