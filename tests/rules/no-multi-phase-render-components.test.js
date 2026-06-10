import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-multi-phase-render-components.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-multi-phase-render-components";

test("reports chart components that accumulate several render phases in one function", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      import { scaleLinear, line } from "d3";

      function PropertyPriceChartContent({ data, activeKey }) {
        const points = data.map((point) => ({ ...point, yearValue: Number(point.year) }));
        const yTicks = [0, 1, 2, 3];
        const yearTicks = points.map((point) => point.yearValue);
        const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
        const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
        const path = line().x((point) => xScale(point.yearValue)).y((point) => yScale(point.price))(points);
        let activePoint = null;

        for (const point of points) {
          if (point.year === activeKey) {
            activePoint = point;
            break;
          }
        }

        const pointMarks = [];
        for (const point of points) {
          pointMarks.push(<circle key={point.year} cx={xScale(point.yearValue)} cy={yScale(point.price)} />);
        }

        return (
          <svg>
            {yTicks.map((tick) => (
              <text key={tick}>{tick}</text>
            ))}
            {yearTicks.map((tick) => (
              <text key={tick}>{tick}</text>
            ))}
            {path ? <path d={path} /> : null}
            {activePoint ? <line x1={0} y1={0} x2={10} y2={10} /> : null}
            {pointMarks}
          </svg>
        );
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "multiPhaseRenderComponent");
});

test("ignores smaller svg components with fewer phases", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      import { scaleLinear } from "d3";

      function MiniChart({ points }) {
        const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
        const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

        return (
          <svg>
            {points.map((point) => (
              <circle key={point.id} cx={xScale(point.x)} cy={yScale(point.y)} />
            ))}
          </svg>
        );
      }
    `,
  });

  assert.equal(messages.length, 0);
});
