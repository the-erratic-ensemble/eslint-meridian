# no-manual-active-item-scan-before-render

Avoid manual loop-and-break scans to derive a render selection before JSX.

## Why This Rule Exists

Before-render scan loops are a small smell on their own, but they often signal that selection logic has been inlined into the render surface instead of being expressed directly. In chart components this usually reads worse than a direct `.find(...)` or a prepared selector.

The rule is intentionally narrow. It is aimed at the “initialize variable, loop, assign, break” pattern used immediately before rendering.

## What It Reports

It warns when a JSX-returning function:

- declares a local target variable such as `activePoint`
- loops over a collection with `for...of`
- assigns the loop item to that variable inside an `if`
- breaks out of the loop

It does not warn on direct `.find(...)` usage or on broader data-processing loops that are not acting as a before-render selection scan.

## Meridian Profile Status

- Rule ID: `meridian-local/no-manual-active-item-scan-before-render`
- Category: Chart rendering readability
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-manual-active-item-scan-before-render.js](../../rules/no-manual-active-item-scan-before-render.js)
- Tests:
  - [tests/rules/no-manual-active-item-scan-before-render.test.js](../../tests/rules/no-manual-active-item-scan-before-render.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no options.

## Examples

### ❌ Incorrect

```tsx
function PriceChart({ points, activeKey }: Props) {
  let activePoint = null;

  for (const point of points) {
    if (point.year === activeKey) {
      activePoint = point;
      break;
    }
  }

  return (
    <svg>
      {activePoint ? <circle cx={activePoint.x} cy={activePoint.y} /> : null}
    </svg>
  );
}
```

### ✅ Correct

```tsx
function PriceChart({ points, activeKey }: Props) {
  const activePoint = points.find((point) => point.year === activeKey) ?? null;
  return (
    <svg>
      {activePoint ? <circle cx={activePoint.x} cy={activePoint.y} /> : null}
    </svg>
  );
}
```

## Refactor Direction

Use `.find(...)` or a prepared selector/helper instead of an inlined loop-and-break scan when you are only trying to identify one selected render item.

## When To Disable

Disable only when the manual loop is genuinely clearer than the direct collection helper and the scan is doing more than a simple selected-item lookup.
