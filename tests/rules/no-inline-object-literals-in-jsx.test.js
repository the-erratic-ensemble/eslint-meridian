import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-inline-object-literals-in-jsx.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-inline-object-literals-in-jsx";

test("reports inline object literals in JSX props by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Widget config={{ size: "lg", tone: theme.tone }} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noInlineObject");
});

test("allows simple objects when configured", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ allowSimpleObjects: true }],
    code: `
      const view = <Widget config={{ size: "lg", tone: theme.tone, state: status }} />;
    `
  });

  assert.equal(messages.length, 0);
});

test("still reports non-simple objects when simple objects are allowed", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ allowSimpleObjects: true }],
    code: `
      const view = <Widget config={{ size: getSize(), tone: theme.tone }} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noInlineObject");
});

test("can scope enforcement to specific prop names", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ propNames: ["config"] }],
    code: `
      const view = <Widget style={{ color: palette.primary }} config={widgetConfig} />;
    `
  });

  assert.equal(messages.length, 0);
});
