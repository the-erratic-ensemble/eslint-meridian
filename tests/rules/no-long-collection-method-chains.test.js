import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-long-collection-method-chains.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-long-collection-method-chains";

test("reports three-step collection pipelines by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const itemsToShow = (items ?? [])
        .filter((item) => item.visible)
        .slice(0, 3)
        .map((item) => item.id);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "longCollectionMethodChain");
  assert.match(messages[0].message, /filter -> slice -> map/);
});

test("reports once for a longer pipeline", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const entries = values
        .map((value) => normalize(value))
        .filter(Boolean)
        .slice(0, 5)
        .map((value, index) => ({ value, index }));
    `
  });

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /4 tracked methods/);
});

test("reports three-step pipelines regardless of method order", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const itemsToShow = items
        .slice(0, 10)
        .map((item) => item.id)
        .filter(Boolean);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "longCollectionMethodChain");
  assert.match(messages[0].message, /slice -> map -> filter/);
});

test("allows two-step collection pipelines by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const itemsToShow = items.filter((item) => item.visible).map((item) => item.id);
    `
  });

  assert.equal(messages.length, 0);
});

test("does not merge outer and nested callback pipelines", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const groupsToRender = groups.map((group) =>
        group.items.filter((item) => item.visible).map((item) => item.id)
      );
    `
  });

  assert.equal(messages.length, 0);
});

test("reports tracked pipelines even when followed by a non-tracked terminal call", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const text = items
        .filter((item) => item.visible)
        .slice(0, 3)
        .map((item) => item.label)
        .join(", ");
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "longCollectionMethodChain");
});

test("supports a custom maximum chain length", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxChainLength: 3 }],
    code: `
      const text = items
        .filter((item) => item.visible)
        .slice(0, 3)
        .map((item) => item.label);
    `
  });

  assert.equal(messages.length, 0);
});

test("supports custom tracked methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ methods: ["filter", "take", "map"], maxChainLength: 2 }],
    code: `
      const text = items.filter((item) => item.visible).take(3).map((item) => item.label);
    `
  });

  assert.equal(messages.length, 1);
});
