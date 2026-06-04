import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-collection-methods-on-spread-arrays.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-collection-methods-on-spread-arrays";

test("reports pure spread arrays that immediately feed collection methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const points = [...(items ?? [])]
        .filter((item) => item.visible)
        .toSorted((left, right) => left.rank - right.rank)
        .slice(0, 5)
        .map((item) => item.id);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "collectionMethodsOnSpreadArray");
  assert.match(messages[0].message, /filter -> toSorted -> slice -> map/);
});

test("reports a single immediate tracked method after a pure spread array", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const points = [...items].filter((item) => item.visible);
    `
  });

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /filter/);
});

test("reports multiple-spread array literals", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const points = [...primaryItems, ...fallbackItems].map((item) => item.id);
    `
  });

  assert.equal(messages.length, 1);
});

test("does not report pure spread clones without post-processing", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const points = [...items];
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report staged locals after the spread", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const clonedItems = [...items];
      const visibleItems = clonedItems.filter((item) => item.visible);
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report mixed inline array assembly because the older spread rule owns that shape", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const points = [selectedItem, ...items].filter((item) => item.visible);
    `
  });

  assert.equal(messages.length, 0);
});
