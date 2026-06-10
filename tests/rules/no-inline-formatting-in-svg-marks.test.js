import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-inline-formatting-in-svg-marks.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-inline-formatting-in-svg-marks";

test("reports raw locale formatting calls inside svg markup", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function PriceChart({ point, tick }) {
        return (
          <svg>
            <text>{tick}</text>
            <title>{point.price.toLocaleString("en-GB")}</title>
          </svg>
        );
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.ok(
    messages.every(
      (message) => message.messageId === "inlineFormattingInSvgMarks",
    ),
  );
});

test("ignores extracted formatter helpers and precomputed labels passed into svg markup", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function formatAxisCurrency(value) {
        return value.toLocaleString("en-GB");
      }

      function PriceChart({ priceLabel, tickLabel }) {
        return (
          <svg>
            <text>{formatAxisCurrency(tickLabel)}</text>
            <title>{priceLabel}</title>
          </svg>
        );
      }
    `,
  });

  assert.equal(messages.length, 0);
});
