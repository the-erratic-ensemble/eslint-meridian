import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-ternary-in-branch-assignment.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-ternary-in-branch-assignment";

test("reports ternary assignment at branch top level", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (isEnabled) {
        value = flag ? one : two;
      } else {
        value = three;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "ternaryAssignment");
});

test("reports nested ternary declaration inside branch blocks", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (isEnabled) {
        try {
          const nextValue = flag ? one : two;
          value = nextValue;
        } catch {
          value = three;
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "ternaryDeclaration");
});

test("does not inspect nested function scopes", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (isEnabled) {
        const helper = () => {
          value = flag ? one : two;
        };
        helper();
      }
    `
  });

  assert.equal(messages.length, 0);
});
