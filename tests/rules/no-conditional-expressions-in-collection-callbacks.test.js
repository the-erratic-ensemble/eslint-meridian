import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-conditional-expressions-in-collection-callbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-conditional-expressions-in-collection-callbacks";

test("reports top-level ternary expression inside map callback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = items.map((item) => item.enabled ? { id: item.id } : { id: "fallback" });
    `
  });

  assert.equal(messages.length, 1);
});

test("allows nullish fallback inside map callback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = items.map((item) => item.label ?? "unknown");
    `
  });

  assert.equal(messages.length, 0);
});

test("allows scalar ternary inside map callback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = items.map((item) => item.enabled ? item.label : "unknown");
    `
  });

  assert.equal(messages.length, 0);
});

test("allows conditional nested inside object literal callback body", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = items.map((item) => ({ id: item.id, label: item.label ? item.label : "unknown" }));
    `
  });

  assert.equal(messages.length, 0);
});
