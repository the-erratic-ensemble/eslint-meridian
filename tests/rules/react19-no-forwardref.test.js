import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/react19-no-forwardref.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "react19-no-forwardref";

test("reports direct forwardRef imports", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "Card.tsx",
    code: `
      import { forwardRef } from "react";

      export const Card = forwardRef(function Card(props, ref) {
        return <div ref={ref}>{props.children}</div>;
      });
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidForwardRef");
});

test("allows configured legacy paths", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    filename: "legacy/Card.tsx",
    options: [{ allowPathIncludes: ["legacy"] }],
    code: `
      import React from "react";

      export const Card = React.forwardRef(function Card(props, ref) {
        return <div ref={ref}>{props.children}</div>;
      });
    `
  });

  assert.equal(messages.length, 0);
});
