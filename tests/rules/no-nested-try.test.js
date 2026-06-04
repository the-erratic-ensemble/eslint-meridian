import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-nested-try.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-nested-try";

test("allows one try block in a function", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          await persist();
        } catch (error) {
          report(error);
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("reports try blocks nested inside another try block", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          await persist();
          try {
            await refresh();
          } catch (error) {
            report(error);
          }
        } catch (error) {
          report(error);
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "nestedTry");
  assert.match(messages[0].message, /inside try blocks/);
});

test("reports try blocks nested inside catch blocks by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          await persist();
        } catch (error) {
          try {
            await rollback();
          } catch (rollbackError) {
            report(rollbackError);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "nestedTry");
  assert.match(messages[0].message, /inside catch blocks/);
});

test("reports try blocks nested inside finally blocks by default", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          await persist();
        } finally {
          try {
            await cleanup();
          } catch (cleanupError) {
            report(cleanupError);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "nestedTry");
  assert.match(messages[0].message, /inside finally blocks/);
});

test("does not cross nested function boundaries", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          const task = async () => {
            try {
              await refresh();
            } catch (error) {
              report(error);
            }
          };

          await task();
        } catch (error) {
          report(error);
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("supports deeper allowed nesting when maxDepth increases", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxDepth: 2 }],
    code: `
      async function saveRecord() {
        try {
          await persist();
          try {
            await refresh();
            try {
              await cleanup();
            } catch (cleanupError) {
              report(cleanupError);
            }
          } catch (error) {
            report(error);
          }
        } catch (error) {
          report(error);
        }
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "nestedTry");
  assert.match(messages[0].message, /depth 3, max 2/);
});

test("can ignore catch-contained nesting when configured", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ trackedAncestorBlocks: ["try"] }],
    code: `
      async function saveRecord() {
        try {
          await persist();
        } catch (error) {
          try {
            await rollback();
          } catch (rollbackError) {
            report(rollbackError);
          }
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report sibling try blocks in the same function", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      async function saveRecord() {
        try {
          await persist();
        } catch (error) {
          report(error);
        }

        try {
          await refresh();
        } catch (error) {
          report(error);
        }
      }
    `
  });

  assert.equal(messages.length, 0);
});
