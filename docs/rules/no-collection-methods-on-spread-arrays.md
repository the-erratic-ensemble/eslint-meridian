# no-collection-methods-on-spread-arrays

Disallow spread-built array literals that immediately feed inline collection methods.

## Why This Rule Exists

`[...(items ?? [])]` already hides one decision: why the data is being re-materialized as a new array right here. Once that spread wrapper is immediately followed by `filter`, `map`, `slice`, `toSorted`, or similar collection work, the expression stops reading like one operation and starts reading like several compressed together.

## What It Reports

It reports pure spread-built array literals whose immediate next step is a tracked collection method.

This rule intentionally focuses on pure spread wrappers like `[...items]` or `[...primary, ...fallback]`. Mixed array assembly such as `[head, ...items].filter(...)` stays owned by `no-inline-spread-collection-pipelines`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-collection-methods-on-spread-arrays`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-collection-methods-on-spread-arrays.js](no-collection-methods-on-spread-arrays.js)
- Tests:
  - [tests/rules/no-collection-methods-on-spread-arrays.test.js](tests/rules/no-collection-methods-on-spread-arrays.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["filter", "map", "flatMap", "reduce", "slice", "sort", "toSorted", "toSpliced", "toReversed", "find", "some", "every", "join"]`) — method names that count as inline post-processing on the spread-built array.

## Examples

### ❌ Incorrect

```js
const points = [...(items ?? [])]
  .filter((item) => item.visible)
  .toSorted((left, right) => left.rank - right.rank)
  .slice(0, 5)
  .map((item) => item.id);
```

```js
const points = [...primaryItems, ...fallbackItems].map((item) => item.id);
```

### ✅ Correct

```js
const categoryItems = [...(items ?? [])];

const points = categoryItems
  .filter((item) => item.visible)
  .toSorted((left, right) => left.rank - right.rank)
  .slice(0, 5)
  .map((item) => item.id);
```

```js
const mergedItems = [...primaryItems, ...fallbackItems];
const pointIds = mergedItems.map((item) => item.id);
```

## Edge Cases and False Positives

- Plain spread clones like `[...items]` are allowed. The rule only fires when tracked post-processing happens immediately afterward.
- Staged locals are allowed. `const cloned = [...items]; cloned.filter(...)` does not report.
- Mixed array assembly with regular elements is intentionally left to `no-inline-spread-collection-pipelines` so the two rules do not duplicate the same shape.

## Refactor Direction

Stage the spread-built array in a named local first, then perform collection work on that local.

## When To Disable

Disable narrowly only when the spread wrapper and the immediate post-processing are both trivial and genuinely clearer inline than through one named intermediate.
