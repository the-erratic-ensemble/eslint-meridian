import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-forbidden-declaration-names.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-forbidden-declaration-names";

const defaultOptions = [
  {
    patterns: [
      {
        contains: "render",
        caseSensitive: false
      }
    ]
  }
];

test("reports forbidden variable names", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: defaultOptions,
    code: `
      const renderedLabel = label.toUpperCase();
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForbiddenDeclarationName");
});

test("respects allowNames overrides", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    options: [
      {
        allowNames: ["RenderMode", "renderMode"],
        patterns: [
          {
            contains: "render",
            caseSensitive: false
          }
        ]
      }
    ],
    code: `
      type RenderMode = "full" | "compact";
      const renderMode: RenderMode = "full";
    `
  });

  assert.equal(messages.length, 0);
});
