import { Linter } from "eslint";
import tsParser from "@typescript-eslint/parser";

const DEFAULT_LANGUAGE_OPTIONS = {
  ecmaVersion: 2022,
  sourceType: "module",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
};

export function runRule({ code, ruleName, rule, options = [], filename = "test.tsx", parser = null }) {
  const linter = new Linter();

  return linter.verify(
    code,
    [
      {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
          ...DEFAULT_LANGUAGE_OPTIONS,
          ...(parser ? { parser } : {})
        },
        plugins: {
          local: {
            rules: {
              [ruleName]: rule
            }
          }
        },
        rules: {
          [`local/${ruleName}`]: ["error", ...options]
        }
      }
    ],
    { filename }
  );
}

export function runPluginRule({
  code,
  pluginName = "meridian-local",
  plugin,
  ruleName,
  options = [],
  filename = "test.tsx",
  parser = null
}) {
  const linter = new Linter();

  return linter.verify(
    code,
    [
      {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
          ...DEFAULT_LANGUAGE_OPTIONS,
          ...(parser ? { parser } : {})
        },
        plugins: {
          [pluginName]: plugin
        },
        rules: {
          [`${pluginName}/${ruleName}`]: ["error", ...options]
        }
      }
    ],
    { filename }
  );
}

export { tsParser };
