import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-deep-optional-chaining-conditions.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-deep-optional-chaining-conditions";

test("allows optional chaining depth at the default threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (user?.profile?.company?.name) {
        showCompany();
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("reports if conditions that exceed the optional chaining threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (user?.profile?.company?.address?.postcode) {
        showCompany();
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "deepOptionalChain");
});

test("reports ternary conditions that exceed the optional chaining threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const label = user?.profile?.company?.address?.postcode ? "ready" : "missing";
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "deepOptionalChain");
});

test("respects a custom maximum optional depth", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxOptionalDepth: 4 }],
    code: `
      if (user?.profile?.company?.address?.postcode) {
        showCompany();
      }
    `
  });

  assert.equal(messages.length, 0);
});
