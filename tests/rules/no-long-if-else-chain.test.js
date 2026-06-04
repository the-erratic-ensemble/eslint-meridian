import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-long-if-else-chain.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-long-if-else-chain";

test("reports chains longer than maxChainLength", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (a) {
        value = 1;
      } else if (b) {
        value = 2;
      } else if (c) {
        value = 3;
      }
    `,
    options: [{ maxChainLength: 2, maxBranchWrites: 10 }]
  });

  assert.equal(
    messages.some((message) => message.messageId === "tooLong"),
    true
  );
});

test("reports branch writes above maxBranchWrites", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (a) {
        value = 1;
        count++;
      } else {
        const next = 3;
        value = next;
      }
    `,
    options: [{ maxChainLength: 4, maxBranchWrites: 2 }]
  });

  assert.equal(
    messages.some((message) => message.messageId === "tooManyWrites"),
    true
  );
});

test("ignores writes inside nested function declarations", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      if (a) {
        function compute() {
          value = 2;
          const nested = 4;
          return nested;
        }
        compute();
      } else {
        fallback();
      }
    `,
    options: [{ maxChainLength: 3, maxBranchWrites: 0 }]
  });

  assert.equal(messages.length, 0);
});
