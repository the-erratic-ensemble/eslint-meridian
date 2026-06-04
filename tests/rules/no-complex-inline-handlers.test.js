import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-complex-inline-handlers.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-inline-handlers";

test("allows expression handlers and two-line block handlers", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <button
          onClick={() => {
            onSelect(item);
            closeMenu();
          }}
        />
      );
    `
  });

  assert.equal(messages.length, 0);
});

test("reports handlers that exceed maxBodyLines", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <button
          onClick={() => {
            if (canSelect(item)) {
              onSelect(item);
              closeMenu();
            }
          }}
        />
      );
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, `local/${RULE_NAME}`);
});

test("reports nested inline prop iifes hidden under conditional props", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <Card
          aria-label={
            isInteractive && metric
              ? (() => {
                  const freshnessSuffix = metric.freshness?.updatedLabel
                    ? \` Recorded \${metric.freshness.updatedLabel}.\`
                    : "";
                  return \`\${metric.label}: \${metric.value}.\${freshnessSuffix}\`;
                })()
              : undefined
          }
        />
      );
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "moveInlineComputation");
});

test("does not duplicate the direct jsx iife guard for top-level prop iifes", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card aria-label={(() => computeLabel())()} />;
    `
  });

  assert.equal(messages.length, 0);
});
