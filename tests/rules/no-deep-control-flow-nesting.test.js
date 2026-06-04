import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-deep-control-flow-nesting.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-deep-control-flow-nesting";

test("allows a single loop with one nested branch", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function collect(values) {
        for (const value of values) {
          if (value.active) {
            keep(value);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("reports nested loops by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function collect(groups) {
        for (const group of groups) {
          for (const item of group.items) {
            keep(item);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyNestedLoops");
});

test("reports third control-flow layer", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function collect(groups) {
        for (const group of groups) {
          if (group.active) {
            for (const item of group.items) {
              keep(item);
            }
          }
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooDeep");
});

test("does not count else-if chains as extra nesting depth", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function select(value) {
        if (value === "a") {
          use("a");
        } else if (value === "b") {
          use("b");
        } else {
          use("c");
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("ignores guard-clause if statements by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function collect(groups) {
        if (groups.length > 0) {
          for (const group of groups) {
            if (!group.active) {
              continue;
            }
          }
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("can opt back into counting guard-clause if statements", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ ignoreGuardClauses: false }],
    code: `
      function collect(groups) {
        if (groups.length > 0) {
          for (const group of groups) {
            if (!group.active) {
              continue;
            }
          }
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooDeep");
});

test("supports custom loop depth", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxLoopDepth: 2 }],
    code: `
      function collect(groups) {
        for (const group of groups) {
          for (const item of group.items) {
            keep(item);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});
