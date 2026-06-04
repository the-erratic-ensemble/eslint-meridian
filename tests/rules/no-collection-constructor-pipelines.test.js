import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-collection-constructor-pipelines.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-collection-constructor-pipelines";

test("reports new Set from map filter pipeline", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Set(messages.map((message) => message.trim()).filter((message) => message.length > 0));
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "collectionConstructorPipeline");
});

test("reports new Map from mapped entries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Map(providedEntries ?? items.map((item) => [item.id, item.label]));
    `
  });

  assert.equal(messages.length, 1);
});

test("allows new Set from identifier", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Set(ids);
    `
  });

  assert.equal(messages.length, 0);
});

test("allows simple one-step new Map index construction", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Map(items.map((item) => [item.id, item]));
    `
  });

  assert.equal(messages.length, 0);
});

test("allows nested callback collection work inside a one-step constructor pipeline", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Set(groups.map((group) => group.items.map((item) => item.id)));
    `
  });

  assert.equal(messages.length, 0);
});

test("allows static new Map entries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const values = new Map([["a", 1], ["b", 2]]);
    `
  });

  assert.equal(messages.length, 0);
});
