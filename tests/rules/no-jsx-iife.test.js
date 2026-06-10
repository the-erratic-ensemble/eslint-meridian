import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-jsx-iife.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-jsx-iife";

test("reports direct IIFEs in JSX children", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <div>{(() => computeLabel())()}</div>;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxIife");
});

test("reports direct IIFEs in JSX attributes", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Card aria-label={(() => computeLabel())()} />;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxIife");
});

test("reports IIFEs nested inside JSX map callbacks", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function Example({ modules }: { modules: Array<{ id: string; title: string }> }): JSX.Element {
        return (
          <div>
            {modules.map((module) =>
              (() => {
                const bodyContent = moduleBodyContent(module);

                return <article key={module.id}>{bodyContent}</article>;
              })(),
            )}
          </div>
        );
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noJsxIife");
});

test("allows ordinary helper calls in JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <div>{formatSummary(model)}</div>;
    `,
  });

  assert.equal(messages.length, 0);
});
