import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-mixed-chart-setup-and-markup-in-component.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-mixed-chart-setup-and-markup-in-component";

test("reports components that combine chart setup with dense svg markup and imperative mark building", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      import { scaleLinear, line } from "d3";

      function PropertyPriceChartContent({ points, yTicks, yearTicks }) {
        const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
        const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
        const path = line().x((point) => xScale(point.x)).y((point) => yScale(point.y))(points);
        const pointMarks = [];

        for (const point of points) {
          pointMarks.push(<circle key={point.id} cx={xScale(point.x)} cy={yScale(point.y)} />);
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
            {pointMarks}
            <title>{points.length}</title>
          </svg>
        );
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "mixedChartSetupAndMarkup");
});

test("ignores lighter svg components without imperative mark building", () => {
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
