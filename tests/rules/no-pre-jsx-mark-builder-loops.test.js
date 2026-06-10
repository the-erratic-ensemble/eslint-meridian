import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-pre-jsx-mark-builder-loops.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-pre-jsx-mark-builder-loops";

test("reports imperative JSX mark arrays rendered from the component", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function PriceChart({ points }) {
        const pointMarks = [];

        for (const point of points) {
          pointMarks.push(<circle key={point.id} cx={point.x} cy={point.y} />);
        }

        return <svg>{pointMarks}</svg>;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "imperativeJsxMarkBuilder");
});

test("ignores JSX arrays that are not rendered from the return tree", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function PriceChart({ points }) {
        const pointMarks = [];

        for (const point of points) {
          pointMarks.push(<circle key={point.id} cx={point.x} cy={point.y} />);
        }

        return <svg />;
      }
    `,
  });

  assert.equal(messages.length, 0);
});
