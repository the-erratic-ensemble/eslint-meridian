import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-indexed-collection-pipeline-fallbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-indexed-collection-pipeline-fallbacks";

test("reports indexed collection pipeline in nullish fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const shortlist =
        [...workspaces]
          .filter((workspace) => workspace.savedAreaCount > 0)
          .toSorted((left, right) => right.savedAreaCount - left.savedAreaCount)[0] ??
        null;
    `
  });

  assert.equal(messages.length, 1);
});

test("reports indexed collection pipeline inside larger fallback chain", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rows.filter((row) => row.active)[0] ??
        rows[0] ??
        null;
    `
  });

  assert.equal(messages.length, 1);
});

test("reports direct indexed collection pipeline without fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected = rows.filter((row) => row.active)[0];
    `
  });

  assert.equal(messages.length, 1);
});

test("reports at(0) collection pipeline without fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected = rows.filter((row) => row.active).at(0);
    `
  });

  assert.equal(messages.length, 1);
});

test("reports first-slot destructuring from collection pipeline", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const [selected] = rows.filter((row) => row.active).toSorted((left, right) => left.rank - right.rank);
    `
  });

  assert.equal(messages.length, 1);
});

test("allows direct indexed fallback without collection shaping", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected = rows[0] ?? null;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows direct at(0) without collection shaping", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected = rows.at(0);
    `
  });

  assert.equal(messages.length, 0);
});

test("allows first-slot destructuring without collection shaping", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const [selected] = rows;
    `
  });

  assert.equal(messages.length, 0);
});
