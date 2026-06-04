import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-render-time-date-in-jsx.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-render-time-date-in-jsx";

test("reports Date construction inside JSX output", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Footer() {
        return <footer>{new Date().getFullYear()}</footer>;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "renderTimeDateInJsx");
});

test("reports Date.now inside JSX output", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Timestamp() {
        return <time>{Date.now()}</time>;
      }
    `
  });

  assert.equal(messages.length, 1);
});

test("allows prepared date values passed into JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Footer({ currentYear }) {
        return <footer>{currentYear}</footer>;
      }
    `
  });

  assert.equal(messages.length, 0);
});
