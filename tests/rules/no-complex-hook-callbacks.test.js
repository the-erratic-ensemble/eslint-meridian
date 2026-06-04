import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-complex-hook-callbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-hook-callbacks";

test("reports hook callbacks with too many branches", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example(items) {
        const memoized = useMemo(() => {
          if (!items.length) {
            return [];
          }

          switch (items[0].kind) {
            case "primary":
              return items;
            default:
              return [];
          }
        }, [items]);
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexHookCallback");
});

test("does not count nested helper internals as outer hook complexity", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example(items) {
        const memoized = useMemo(() => {
          const summarize = () => {
            if (items.length > 2) {
              return items[0];
            }

            return null;
          };

          return summarize();
        }, [items]);
      }
    `
  });

  assert.equal(messages.length, 0);
});
