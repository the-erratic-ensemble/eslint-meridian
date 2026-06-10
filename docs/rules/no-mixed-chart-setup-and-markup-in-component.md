# no-mixed-chart-setup-and-markup-in-component

Avoid chart components that combine chart setup and dense SVG markup in one render surface.

## Why This Rule Exists

Some chart components accumulate scale setup, path generation, mark orchestration, and the final SVG tree in one function. That usually produces a file that is technically correct but slow to scan, awkward to review, and brittle to change.

This is not a general “component too long” rule. It is limited to chart-like components that return SVG and also perform meaningful chart setup inside the same function.

## What It Reports

It warns on JSX-returning components that:

- render SVG markup
- perform multiple chart setup calls such as `scaleLinear(...)` or `line(...)`
- contain dense SVG expression containers
- also build rendered mark arrays imperatively before returning

It is aimed at components like `PropertyPriceChartContent`, where setup and SVG rendering are both heavy in the same function.

## Meridian Profile Status

- Rule ID: `meridian-local/no-mixed-chart-setup-and-markup-in-component`
- Category: Chart rendering readability
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-mixed-chart-setup-and-markup-in-component.js](../../rules/no-mixed-chart-setup-and-markup-in-component.js)
- Tests:
  - [tests/rules/no-mixed-chart-setup-and-markup-in-component.test.js](../../tests/rules/no-mixed-chart-setup-and-markup-in-component.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `minChartSetupSignals` (default: `2`) — minimum number of chart setup calls before the rule can report.
- `minSvgMarkupSignals` (default: `5`) — minimum number of SVG expression containers before the rule can report.

## Examples

### ❌ Incorrect

```tsx
function PropertyPriceChartContent({ points, yTicks, yearTicks }: Props) {
  const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
  const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
  const path = line()
    .x((point) => xScale(point.x))
    .y((point) => yScale(point.y))(points);
  const pointMarks = [];

  for (const point of points) {
    pointMarks.push(
      <circle key={point.id} cx={xScale(point.x)} cy={yScale(point.y)} />,
    );
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
    </svg>
  );
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
      <PropertyPriceLine model={model} />
      <PropertyPricePointMarks model={model} />
    </svg>
  );
}
```

## Refactor Direction

Separate prepared chart data from SVG rendering. Good first moves are extracting a prepared chart model, an axes subcomponent, or a mark-rendering layer instead of keeping setup and markup fused together.

## When To Disable

Disable only when the component is intentionally small enough that splitting setup from markup would add indirection without improving legibility.
