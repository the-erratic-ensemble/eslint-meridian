# no-pre-jsx-mark-builder-loops

Avoid building rendered JSX mark arrays imperatively before returning JSX.

## Why This Rule Exists

Chart and SVG components often drift into an imperative pre-render phase where the function allocates an empty array, loops, and pushes JSX marks into it. That hides render structure in setup code and makes the render path harder to scan.

The rule is narrow. It targets rendered JSX arrays built with `push(...)` inside loops, not every local array or every loop inside a component.

## What It Reports

It warns when a JSX-returning function creates an empty array, pushes JSX into it inside a loop, and later renders that array in JSX.

It is meant for patterns such as `const pointMarks = []; ... pointMarks.push(<circle ... />); ... return <svg>{pointMarks}</svg>;`.

It does not warn on arrays that are never rendered, or on non-JSX arrays built for data preparation.

## Meridian Profile Status

- Rule ID: `meridian-local/no-pre-jsx-mark-builder-loops`
- Category: Chart rendering readability
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-pre-jsx-mark-builder-loops.js](../../rules/no-pre-jsx-mark-builder-loops.js)
- Tests:
  - [tests/rules/no-pre-jsx-mark-builder-loops.test.js](../../tests/rules/no-pre-jsx-mark-builder-loops.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no options.

## Examples

### ❌ Incorrect

```tsx
function PriceChart({ points }: { points: Point[] }) {
  const pointMarks = [];

  for (const point of points) {
    pointMarks.push(<circle key={point.id} cx={point.x} cy={point.y} />);
  }

  return <svg>{pointMarks}</svg>;
}
```

### ✅ Correct

```tsx
function PriceChart({ points }: { points: Point[] }) {
  return (
    <svg>
      {points.map((point) => (
        <circle key={point.id} cx={point.x} cy={point.y} />
      ))}
    </svg>
  );
}
```

## Refactor Direction

Prefer a direct JSX `map(...)` render path or extract a mark-rendering component instead of building rendered JSX arrays imperatively ahead of the return tree.

## When To Disable

Disable only when the imperative builder is materially clearer than the direct JSX form and the array is acting as a real rendering boundary rather than a hidden pre-render stage.
