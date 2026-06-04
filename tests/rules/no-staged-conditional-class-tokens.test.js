import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-staged-conditional-class-tokens.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-staged-conditional-class-tokens";

test("reports conditional class token variables interpolated into JSX className", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Card({ active }) {
        const statusClass = active ? "bg-brand-300" : "text-white/60";
        return <div className={\`rounded \${statusClass}\`} />;
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "stagedConditionalClassToken");
});

test("reports conditional class token variables passed directly to className", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Card({ active }) {
        const buttonClassName = active ? activeClassName : inactiveClassName;
        return <button className={buttonClassName} />;
      }
    `
  });

  assert.equal(messages.length, 1);
});

test("allows conditional variables that are not used by className", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Card({ active }) {
        const statusClass = active ? "bg-brand-300" : "text-white/60";
        return <div data-state={statusClass} />;
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("allows stable class token variables", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Card() {
        const statusClass = "rounded border";
        return <div className={statusClass} />;
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("does not leak staged class token names across sibling functions", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      function Header({ active }) {
        const statusClass = active ? "bg-brand-300" : "text-white/60";
        return <header />;
      }

      function Card({ statusClass }) {
        return <div className={statusClass} />;
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report when an inner parameter shadows an outer staged class token", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const statusClass = enabled ? "bg-brand-300" : "text-white/60";

      function Card({ statusClass }) {
        return <div className={statusClass} />;
      }
    `
  });

  assert.equal(messages.length, 0);
});
