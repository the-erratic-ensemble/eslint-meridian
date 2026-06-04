import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-flatmap-present-items.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-flatmap-present-items";

test("reports flatMap callback with one-item array and empty array branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = items.flatMap((item) => item.enabled ? [item.id] : []);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "flatMapPresentItems");
});

test("reports reversed branch order", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = items.flatMap((item) => item.enabled ? [] : [item.id]);
    `
  });

  assert.equal(messages.length, 1);
});

test("allows flatMap callback with multi-item expansion", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = items.flatMap((item) => item.enabled ? [item.id, item.label] : []);
    `
  });

  assert.equal(messages.length, 0);
});

test("allows map callback with one-item array branch", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = items.map((item) => item.enabled ? [item.id] : []);
    `
  });

  assert.equal(messages.length, 0);
});
