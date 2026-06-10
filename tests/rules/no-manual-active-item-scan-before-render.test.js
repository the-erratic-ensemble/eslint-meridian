import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-manual-active-item-scan-before-render.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-manual-active-item-scan-before-render";

test("reports manual loop-and-break scans used to derive the active item before render", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function PriceChart({ points, activeKey }) {
        let activePoint = null;

        for (const point of points) {
          if (point.year === activeKey) {
            activePoint = point;
            break;
          }
        }

        return <svg>{activePoint ? <circle cx={activePoint.x} cy={activePoint.y} /> : null}</svg>;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "manualActiveItemScan");
});

test("ignores direct find-based selection before render", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function PriceChart({ points, activeKey }) {
        const activePoint = points.find((point) => point.year === activeKey) ?? null;
        return <svg>{activePoint ? <circle cx={activePoint.x} cy={activePoint.y} /> : null}</svg>;
      }
    `,
  });

  assert.equal(messages.length, 0);
});
