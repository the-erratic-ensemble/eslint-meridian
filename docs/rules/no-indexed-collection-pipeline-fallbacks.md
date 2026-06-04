# no-indexed-collection-pipeline-fallbacks

Disallow indexed collection pipeline results hidden inside `??` / `||` fallback chains.

## Why This Rule Exists

Indexing into the result of a pipeline and then hiding that inside a fallback chain compresses several ideas together: transform, select, and recover. That shape is compact but hard to trust on first read.

## What It Reports

It looks for fallback chains where an indexed access depends on an inlined collection pipeline result.

## Meridian Profile Status

- Rule ID: `meridian-local/no-indexed-collection-pipeline-fallbacks`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-indexed-collection-pipeline-fallbacks.js](../../rules/no-indexed-collection-pipeline-fallbacks.js)
- Tests:
  - [tests/rules/no-indexed-collection-pipeline-fallbacks.test.js](../../tests/rules/no-indexed-collection-pipeline-fallbacks.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["filter", "map", "flatMap", "slice", "sort", "toSorted"]`)
- `operators` (default: `["??", "||"]`)

## Examples

### ❌ Incorrect

```js
const ids = rows.filter(valid)[0] || rows.map(normalize)[0];
```

### ✅ Correct

```js
const primary = rows.filter(valid);
const first = primary[0] || rows.map(normalize)[0];
```

## Refactor Direction

Stage the transformed collection first, then index into it in a separate step with a name that explains the intermediate result.

## When To Disable

Disable when the pipeline is truly trivial and the fallback chain is already an established, readable local idiom.
