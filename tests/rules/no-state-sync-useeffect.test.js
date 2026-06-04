import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-state-sync-useeffect.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-state-sync-useeffect";

test("reports trivial useEffect state mirroring from dependencies", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useEffect(() => {
          setValue(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidSyncEffect");
});

test("allows effects with extra statements", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useEffect(() => {
          setValue(selected);
          trackSelection(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("supports member-based effect hooks and nested dependency expressions", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        React.useEffect(() => {
          setValue(selected?.id);
        }, [selected?.id]);
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidSyncEffect");
});

test("reports trivial useLayoutEffect state mirroring from dependencies", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useLayoutEffect(() => {
          setValue(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidSyncEffect");
});

test("allows guarded sync effects because they are outside the narrow trivial pattern", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useEffect(() => {
          if (!selected) {
            return;
          }

          setValue(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("allows useLayoutEffect when the body is outside the narrow trivial pattern", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useLayoutEffect(() => {
          if (!selected) {
            return;
          }

          setValue(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("allows alias setter calls outside the default setter naming heuristic", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Example({ selected }) {
        useEffect(() => {
          syncValue(selected);
        }, [selected]);
      }
    `
  });

  assert.equal(messages.length, 0);
});
