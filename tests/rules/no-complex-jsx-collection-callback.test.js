import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-complex-jsx-collection-callback.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-jsx-collection-callback";

test("allows simple expression-body callbacks", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const items = [1, 2, 3];
      const view = <>{items.map((item) => <span>{item}</span>)}</>;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports block-body callbacks when disallowBlockBody is true", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const items = [1, 2, 3];
      const view = (
        <>
          {items.map((item) => {
            return <span>{item}</span>;
          })}
        </>
      );
    `,
    options: [{ disallowBlockBody: true }]
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, `local/${RULE_NAME}`);
});

test("reports block-body callbacks nested inside JSX conditional branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <>
          {hasItems ? rows.map((row) => {
            const label = row.label.trim();
            return <span>{label}</span>;
          }) : null}
        </>
      );
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, `local/${RULE_NAME}`);
});

test("allows simple callbacks nested inside JSX conditional branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <>
          {hasItems ? rows.map((row) => <span>{row.label}</span>) : null}
        </>
      );
    `
  });

  assert.equal(messages.length, 0);
});

test("allows block-body callbacks when disallowBlockBody is false", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const items = [1, 2, 3];
      const view = (
        <>
          {items.map((item) => {
            return <span>{item}</span>;
          })}
        </>
      );
    `,
    options: [{ disallowBlockBody: false, maxStatements: 1 }]
  });

  assert.equal(messages.length, 0);
});
