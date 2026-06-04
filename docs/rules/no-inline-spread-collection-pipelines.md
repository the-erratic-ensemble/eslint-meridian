# no-inline-spread-collection-pipelines

Disallow inline array literals that both:

- assemble values with one or more direct elements plus a spread element that contains collection-pipeline work, and
- either keep chaining work on the whole array inline or hide multiple collection steps inside the spread itself.

The rule exists for shapes like:

- prepend + spread-filter + slice
- prepend + spread-filter-map

It does not report staged locals such as `[head, ...deduped].slice(0, 5)` when the collection work already happened outside the array literal.

## Why This Rule Exists

Spread elements already hide where values come from. When the spread also contains filtering, mapping, slicing, or fallback logic, the resulting array literal stops reading like data assembly and starts reading like a puzzle.

## What It Reports

It targets array literals that combine direct elements with spread-based collection pipelines, especially when those pipelines do more than one transformation step.

## Meridian Profile Status

- Rule ID: `meridian-local/no-inline-spread-collection-pipelines`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-inline-spread-collection-pipelines.js](../../rules/no-inline-spread-collection-pipelines.js)
- Tests:
  - [tests/rules/no-inline-spread-collection-pipelines.test.js](../../tests/rules/no-inline-spread-collection-pipelines.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "flatMap", "reduce", "toSorted", "toSpliced", "toReversed"]`) — method names counted as collection-pipeline steps inside the spread argument.
- `postProcessMethods` (default: `["slice", "map", "filter", "flatMap", "reduce", "join", "find", "some", "every"]`) — methods that count as “the array literal is still being processed inline” after assembly.

## Examples

### ❌ Incorrect

```js
const nextItems = [
  selectedItem,
  ...items.filter((item) => item.id !== selectedItem.id),
].slice(0, 5);
```

```js
const nextItems = [
  selectedItem,
  ...items.filter((item) => item.visible).map((item) => item.id),
];
```

### ✅ Correct

```js
const dedupedItems = items.filter((item) => item.id !== selectedItem.id);
const nextItems = [selectedItem, ...dedupedItems].slice(0, 5);
```

```js
const visibleItemIds = items
  .filter((item) => item.visible)
  .map((item) => item.id);
const nextItems = [selectedItem, ...visibleItemIds];
```

## Refactor Direction

Name the spread source first, then assemble the final array from clear intermediate values.

## When To Disable

Disable when the spread pipeline is short, linear, and genuinely easier to understand inline than through extra locals.
