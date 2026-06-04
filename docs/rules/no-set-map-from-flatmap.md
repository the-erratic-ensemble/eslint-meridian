# no-set-map-from-flatmap

Do not build `Set`/`Map` directly from a `flatMap` result; build and filter first.

## Why This Rule Exists

Feeding `flatMap` directly into `Set` or `Map` construction hides two transformations in one expression: flattening and collection construction. The result is compact but obscures the data shape you are actually constructing.

## What It Reports

It specifically targets `new Set(...)` and `new Map(...)` calls whose source is a `flatMap(...)` result.

## Meridian Profile Status

- Rule ID: `meridian-local/no-set-map-from-flatmap`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-set-map-from-flatmap.js](../../rules/no-set-map-from-flatmap.js)
- Tests:
  - [tests/rules/no-set-map-from-flatmap.test.js](../../tests/rules/no-set-map-from-flatmap.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no configurable options.

## Examples

### ❌ Incorrect

```js
const ids = new Set(items.flatMap((item) => item.ids));
```

### ✅ Correct

```js
const flatIds = items.flatMap((item) => item.ids);
const ids = new Set(flatIds);
```

## Refactor Direction

Flatten first into a named array, then construct the `Set` or `Map` from that intermediate result.

## When To Disable

Disable when the flattening step is obvious, one-off, and introducing an intermediate name would not materially improve clarity.
