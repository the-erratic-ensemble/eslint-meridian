import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-repeated-collection-method-fallbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-repeated-collection-method-fallbacks";

test("reports repeated find fallback chain on the same collection", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const preferredRow =
        categoryRows.find((row) => row.hasPercentage) ??
        categoryRows.find((row) => row.hasDenominator) ??
        categoryRows[0] ??
        null;
    `
  });

  assert.equal(messages.length, 1);
});

test("reports mixed repeated collection methods on the same collection", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rows.filter((row) => row.active) ||
        rows.map((row) => row.label) ||
        [];
    `
  });

  assert.equal(messages.length, 1);
});

test("allows a single find with a simple fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected = rows.find((row) => row.id === activeId) ?? rows[0] ?? null;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows repeated tracked methods when the collection expression changes", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        primaryRows.find((row) => row.isPrimary) ??
        fallbackRows.filter((row) => row.isFallback) ??
        null;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports repeated collection methods when computed and dot property access target the same receiver", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rowsByStatus["primary"].find((row) => row.primary) ??
        rowsByStatus.primary.filter((row) => row.fallback) ??
        null;
    `
  });

  assert.equal(messages.length, 1);
});
