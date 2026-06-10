import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-complex-conditional-text-in-jsx.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-conditional-text-in-jsx";

test("reports inline JSX text with logical test and assembled template text", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <p>
          {criticalFeatures.length > 0 || warningFeatures.length > 0
            ? \`\${criticalFeatures.length} critical · \${warningFeatures.length} warning\`
            : "No alerts"}
        </p>
      );
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexConditionalTextInJsx");
});

test("reports inline JSX text with multi-expression template branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <p>
          {showSummary ? \`\${used} used · \${remaining} left\` : "No usage yet"}
        </p>
      );
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexConditionalTextInJsx");
});

test("allows simple JSX text ternaries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <p>{count > 0 ? \`\${count} alerts\` : "No alerts"}</p>;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows precomputed labels in JSX ternaries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const activeLabel = isArchived ? "Archived" : "Live";
      const view = <p>{showLabel ? activeLabel : fallbackLabel}</p>;
    `
  });

  assert.equal(messages.length, 0);
});

test("ignores JSX attribute ternaries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Button label={isCritical || isWarning ? "Alert" : "OK"} />;
    `
  });

  assert.equal(messages.length, 0);
});
