import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-collection-methods-in-ternaries.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-collection-methods-in-ternaries";

test("reports direct collection method call inside ternary branch", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = hasIds ? ids : rows.map((row) => row.id);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "collectionMethodInTernary");
});

test("reports ternary when both branches do collection method work", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = isReady ? rows.map((row) => row.id) : rows.filter((row) => row.active);
    `
  });

  assert.equal(messages.length, 1);
});

test("allows nested map inside jsx branch", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const content = showList ? <ul>{rows.map((row) => <li key={row.id}>{row.label}</li>)}</ul> : null;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows ternary branch that swaps between array literals", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = isEmpty ? [] : [...rows];
    `
  });

  assert.equal(messages.length, 0);
});

test("allows scalar ternary branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const label = isReady ? "ready" : "pending";
    `
  });

  assert.equal(messages.length, 0);
});
