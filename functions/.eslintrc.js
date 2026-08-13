module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
  },
  ignorePatterns: [
    "/generated/**/*",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    // relaxed for legacy compiled code
    "max-len": "off",
    "require-jsdoc": "off",
    "camelcase": "off",
  },
};
