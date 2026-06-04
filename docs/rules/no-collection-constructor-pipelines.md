# no-collection-constructor-pipelines

Disallow constructing `Set`/`Map` directly from inlined collection pipelines or guarded fallbacks.

## Why This Rule Exists

Constructors like `new Set(...)` and `new Map(...)` become hard to scan when they also hide filtering, mapping, fallback logic, or multi-step collection shaping in the constructor argument itself.

## What It Reports

It targets `Set` and `Map` constructor inputs that inline more than a simple one-step transformation. The goal is to stage the collection work first, then construct the final collection from a clearly named intermediate value.

## Meridian Profile Status

- Rule ID: `meridian-local/no-collection-constructor-pipelines`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-collection-constructor-pipelines.js](../../rules/no-collection-constructor-pipelines.js)
- Tests:
  - [tests/rules/no-collection-constructor-pipelines.test.js](../../tests/rules/no-collection-constructor-pipelines.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "flatMap"]`) — collection methods considered part of a pipeline.

## Examples

### ❌ Incorrect

```js
const rows = new Set(items.filter(clean).map(transform));
```

### ✅ Correct

```js
const transformed = items.filter(clean).map(transform);
const rows = new Set(transformed);
```

## Refactor Direction

Extract the pipeline into a local `const` with a name that explains the shape, then pass that value into `new Set(...)` or `new Map(...)`.

## When To Disable

Disable when the constructor input is still genuinely trivial and extraction would make a short obvious expression harder to read.
