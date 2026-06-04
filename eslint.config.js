import baseConfig from "../config/eslint.config.js";

const rulePackageOverrides = {
  files: ["**/*.js"],
  rules: {
    "no-useless-escape": "off",
    "unicorn/consistent-existence-index-check": "off",
    "unicorn/explicit-length-check": "off",
    "unicorn/no-array-callback-reference": "off",
    "unicorn/no-array-reduce": "off",
    "unicorn/no-negated-condition": "off",
    "unicorn/no-null": "off",
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/prefer-export-from": "off",
    "unicorn/prefer-json-parse-buffer": "off",
    "unicorn/prevent-abbreviations": "off"
  }
};

const maintainerScriptOverrides = {
  files: ["scripts/**/*.mjs"],
  rules: {
    "n/no-process-exit": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-null": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/prefer-string-replace-all": "off",
    "unicorn/prevent-abbreviations": "off"
  }
};

export default [...baseConfig, rulePackageOverrides, maintainerScriptOverrides];
