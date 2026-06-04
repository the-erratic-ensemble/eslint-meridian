import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-set-map-from-flatmap.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-set-map-from-flatmap";

test("reports new Set from flatMap", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Set(items.flatMap((item) => item.labels));
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "setOrMapFromFlatMap");
});

test("reports new Map from flatMap", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Map(items.flatMap((item) => item.enabled ? [[item.id, item.value]] : []));
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "setOrMapFromFlatMap");
});

test("allows new Set from map", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Set(items.map((item) => item.id));
    `
  });

  assert.equal(messages.length, 0);
});

test("allows staged flatMap before new Set", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const labels = items.flatMap((item) => item.labels);
      const values = new Set(labels);
    `
  });

  assert.equal(messages.length, 0);
});
