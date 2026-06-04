import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-complex-array-callbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-array-callbacks";

test("reports complex non-JSX map callback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const rows = list.map((item) => {
        const label = format(item);
        return label;
      });
    `
  });

  assert.equal(messages.length, 1);
});

test("skips JSX map callback when method is in skipJsxCollectionMethods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <ul>
          {items.map((item) => {
            const label = item.label;
            return <li>{label}</li>;
          })}
        </ul>
      );
    `
  });

  assert.equal(messages.length, 0);
});

test("can opt back into JSX collection checking", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <ul>
          {items.map((item) => {
            const label = item.label;
            return <li>{label}</li>;
          })}
        </ul>
      );
    `,
    options: [{ skipJsxCollectionMethods: [] }]
  });

  assert.equal(messages.length, 1);
});

test("does not count nested helper internals beyond the nested-function signal", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const rows = list.map((item) => {
        const buildRow = () => {
          if (item.visible) {
            return item.label;
          }

          return null;
        };

        return buildRow();
      });
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexCallback");
  assert.match(messages[0].message, /Do not nest extra functions inside the callback/);
});
