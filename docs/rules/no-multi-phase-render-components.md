# no-multi-phase-render-components

Avoid SVG-rendering components that accumulate too many render phases in one function.

## Why This Rule Exists

Some render components end up carrying several distinct jobs at once: derive data, configure chart geometry, scan for a selected item, build marks, and emit the final SVG tree. Even when each part is individually small, the overall component becomes difficult to scan and maintain.

This is deliberately heuristic-heavy and meant for pilot rollout only. It is not a blanket line-count rule.

## What It Reports

It warns on JSX-returning SVG components when the same function appears to cover several render phases, such as:

- derived data preparation
- chart setup
- selection scanning
- mark building
- final SVG markup

It is designed to catch the “everything happens in one chart component” shape rather than ordinary small render functions.

## Meridian Profile Status

- Rule ID: `meridian-local/no-multi-phase-render-components`
- Category: Chart rendering readability
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-multi-phase-render-components.js](../../rules/no-multi-phase-render-components.js)
- Tests:
  - [tests/rules/no-multi-phase-render-components.test.js](../../tests/rules/no-multi-phase-render-components.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `minPhases` (default: `4`) — minimum number of distinct render phases before the rule can report.

## Examples

### ❌ Incorrect

```tsx
function PropertyPriceChartContent({ data, activeKey }: Props) {
  const points = data.map((point) => ({
    ...point,
    yearValue: Number(point.year),
  }));
  const yTicks = [0, 1, 2, 3];
  const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
  const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
  let activePoint = null;

  for (const point of points) {
    if (point.year === activeKey) {
      activePoint = point;
      break;
    }
  }

  const pointMarks = [];
  for (const point of points) {
    pointMarks.push(
      <circle
        key={point.year}
        cx={xScale(point.yearValue)}
        cy={yScale(point.price)}
      />,
    );
  }

  return <svg>{pointMarks}</svg>;
}
```

### ✅ Correct

```tsx
function PropertyPriceChartContent({
  model,
}: {
  model: PreparedPriceChartModel;
}) {
  return (
    <svg>
      <PropertyPriceAxes model={model} />
      <PropertyPricePointMarks model={model} />
    </svg>
  );
}
```

## Refactor Direction

Break the component into prepared data, selection logic, and SVG rendering layers so each render function has one obvious job.

## When To Disable

Disable only when the component is still easy to scan as a single unit and splitting the phases would create more indirection than clarity.
