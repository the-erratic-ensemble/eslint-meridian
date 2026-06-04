import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../jsx-no-leaked-render.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "jsx-no-leaked-render";

test("reports identifier-left logical renders in JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{showCompareAction && <CompareButton />}</section>;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, `local/${RULE_NAME}`);
  assert.equal(messages[0].messageId, "noPotentialLeakedRender");
});

test("allows explicitly coerced logical renders in JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{!!showCompareAction && <CompareButton />}</section>;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows binary and call-expression logical render guards", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <section>
          {selectedItems.length === 2 && <CompareButton />}
          {Boolean(showCompareAction) && <CompareButton />}
        </section>
      );
    `
  });

  assert.equal(messages.length, 0);
});

test("allows identifiers initialized with boolean literals", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const showCompareAction = true;
      const view = <section>{showCompareAction && <CompareButton />}</section>;
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report logical expressions outside JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const shouldCompare = showCompareAction && selectedItems.length === 2;
      const view = <section>{shouldCompare ? <CompareButton /> : null}</section>;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports ternary null alternates when ternary strategy is disabled", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ validStrategies: ["coerce"] }],
    code: `
      const view = <section>{showCompareAction ? <CompareButton /> : null}</section>;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "noPotentialLeakedRender");
});

test("allows ternary render paths with default strategies", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{showCompareAction ? <CompareButton /> : null}</section>;
    `
  });

  assert.equal(messages.length, 0);
});
