import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-inline-spread-collection-pipelines.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-inline-spread-collection-pipelines";

test("reports inline prepend plus spread filter followed by slice", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const nextItems = [selectedItem, ...items.filter((item) => item.id !== selectedItem.id)].slice(0, 5);
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineSpreadCollectionPipeline");
});

test("reports multi-step collection pipeline hidden inside spread", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const nextItems = [selectedItem, ...items.filter((item) => item.visible).map((item) => item.id)];
    `
  });

  assert.equal(messages.length, 1);
});

test("allows simple prepend plus spread identifier", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const nextItems = [selectedItem, ...items];
    `
  });

  assert.equal(messages.length, 0);
});

test("allows post-processing after a staged spread identifier", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const filteredItems = items.filter((item) => item.visible);
      const nextItems = [selectedItem, ...filteredItems].slice(0, 5);
    `
  });

  assert.equal(messages.length, 0);
});

test("allows pure spread pipeline without mixed inline array assembly", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const nextItems = [...new Set(items.filter((item) => item.visible))];
    `
  });

  assert.equal(messages.length, 0);
});
