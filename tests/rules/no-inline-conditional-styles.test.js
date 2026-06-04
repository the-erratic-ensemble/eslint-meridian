import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-inline-conditional-styles.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-inline-conditional-styles";

test("allows simple identifier fallback ternaries by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={isActive ? activeClassName : idleClassName} />;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports inline ternary class selection", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={isActive ? "card-active" : "card-idle"} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineConditionalStyle");
});

test("reports conditional arguments passed into class helpers", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card className={clsx("card", isActive ? "card-active" : "card-idle")} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineConditionalStyle");
});

test("can opt into rejecting logical-and style assembly", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ disallowLogicalAnd: true }],
    code: `
      const view = <Card className={isActive && "card-active"} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineConditionalStyle");
});
