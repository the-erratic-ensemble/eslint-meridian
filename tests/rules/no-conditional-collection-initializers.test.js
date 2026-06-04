import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-conditional-collection-initializers.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-conditional-collection-initializers";

test("reports ternary initializer that chooses between an existing array and filtered array", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const nextItems = showAll ? items : items.filter((item) => item.active);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "conditionalCollectionInitializer");
});

test("reports ternary initializer that chooses between array guard and empty array", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = Array.isArray(input) ? input : [];
    `
  });

  assert.equal(messages.length, 1);
});

test("allows mixed collection and scalar ternary initializer", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const value = showAll ? items.filter((item) => item.active) : selectedId;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows scalar ternary initializer", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const label = isReady ? "ready" : "pending";
    `
  });

  assert.equal(messages.length, 0);
});

test("allows collection ternary in return statement", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function getItems() {
        return isReady ? items : [];
      }
    `
  });

  assert.equal(messages.length, 0);
});
