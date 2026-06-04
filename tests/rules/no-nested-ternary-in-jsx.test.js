import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-nested-ternary-in-jsx.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-nested-ternary-in-jsx";

test("allows a single ternary in JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{isLoading ? <Spinner /> : <Content />}</section>;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows nested ternaries outside JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const label = isPrimary ? (isLocked ? "Preview" : "Full") : "Hidden";
      const view = <span>{label}</span>;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports nested ternaries directly inside JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{isPrimary ? (isLocked ? <Preview /> : <Full />) : <Empty />}</section>;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, `local/${RULE_NAME}`);
  assert.equal(messages[0].messageId, "avoidNestedTernaryInJsx");
});

test("reports nested ternaries in direct JSX attribute values", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <Button label={isPrimary ? (isLocked ? "Preview" : "Full") : "Hidden"} />;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidNestedTernaryInJsx");
});

test("ignores nested ternaries inside inline callback bodies under JSX", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = <section>{show ? <Button onClick={() => mode ? one : two} /> : null}</section>;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports the AreaReferencePrimitives nested JSX ternary shape", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const view = (
        <div>
          {onDeepDive ? (
            <Button>
              <span>{deepDiveLabel || (hasGate ? "Deep Dive" : "Analysis")}</span>
              {isLocked ? <span>Preview</span> : null}
            </Button>
          ) : null}
        </div>
      );
    `
  });

  assert.equal(messages.length, 2);
  assert.ok(messages.every((message) => message.messageId === "avoidNestedTernaryInJsx"));
});
