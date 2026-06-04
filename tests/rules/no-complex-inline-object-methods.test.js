import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-complex-inline-object-methods.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-inline-object-methods";

test("allows simple inline object methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        clearHistory: () => {
          clearTenantHistory();
          set({ history: [] });
        }
      };
    `
  });

  assert.equal(messages.length, 0);
});

test("reports short but structurally complex inline object methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        fetchSummary: () =>
          isReady && hasSelection
            ? items.map((item) => (item.active ? summarize(item) : null))
            : null
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooComplex");
});

test("reports object method shorthand with branching and nested callback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const handlers = {
        saveDraft() {
          if (!isReady) {
            return null;
          }

          return rows.map((row) => row.value || fallback);
        }
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooComplex");
});

test("supports custom complexity threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxComplexitySignals: 4 }],
    code: `
      const store = {
        fetchSummary: () =>
          isReady && hasSelection
            ? items.map((item) => (item.active ? summarize(item) : null))
            : null
      };
    `
  });

  assert.equal(messages.length, 0);
});
