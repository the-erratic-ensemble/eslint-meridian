# no-long-collection-method-chains

Disallow inline collection pipelines once they chain too many tracked collection methods.

## Why This Rule Exists

Short pipelines are often clearer than extra locals. Past a small threshold, though, a collection chain stops reading like one transformation and starts reading like compressed implementation detail. Meridian uses this rule to catch the point where the reader has to stop and ask what the pipeline is really doing.

## What It Reports

It reports the outermost tracked collection-method call when the main pipeline chain exceeds the configured maximum.

The rule only counts the direct callee-object chain, so nested callback work is not counted as part of the outer pipeline.
There is no required starting method or preferred order. Any tracked sequence such as `slice -> map -> filter` or `map -> filter -> toSorted` counts the same way.

## Meridian Profile Status

- Rule ID: `meridian-local/no-long-collection-method-chains`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-long-collection-method-chains.js](no-long-collection-method-chains.js)
- Tests:
  - [tests/rules/no-long-collection-method-chains.test.js](tests/rules/no-long-collection-method-chains.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `maxChainLength` (default: `2`) — maximum allowed tracked methods in one inline pipeline. With the default, the third tracked method reports.
- `methods` (default: `["filter", "map", "flatMap", "slice", "sort", "toSorted", "toSpliced", "toReversed", "reduce", "find", "some", "every"]`) — method names counted as tracked collection steps.

## Examples

### ❌ Incorrect

```js
const itemsToShow = (items ?? [])
  .filter((item) => item.visible)
  .slice(0, 3)
  .map((item) => item.id);
```

```js
const scopedEntries = postcodes
  .map((value) => normalizePostcode(value))
  .filter(Boolean)
  .slice(0, MAX_HISTORY_ITEMS)
  .map((value, index) => ({ value, index }));
```

```js
const itemsToShow = items
  .slice(0, 10)
  .map((item) => item.id)
  .filter(Boolean);
```

### ✅ Correct

```js
const visibleItems = (items ?? []).filter((item) => item.visible);
const shortlistItems = visibleItems.slice(0, 3);

const itemsToShow = shortlistItems.map((item) => item.id);
```

```js
const normalizedPostcodes = postcodes
  .map((value) => normalizePostcode(value))
  .filter(Boolean)
  .slice(0, MAX_HISTORY_ITEMS);

const scopedEntries = normalizedPostcodes.map((value, index) => ({ value, index }));
```

## Edge Cases and False Positives

- Nested callback pipelines are treated independently. The rule does not combine outer and inner chains into one count.
- Only the outermost tracked call reports. This avoids duplicate warnings on every step of the same pipeline.
- The rule does not prove the receiver is a real array. If a non-collection API happens to use the same method names and the warning is not useful, narrow `methods` for that surface instead of weakening the package rule globally.

## Refactor Direction

Stage one intermediate result in a named local so the remaining steps describe intent instead of hiding the whole transformation in one chain.

## When To Disable

Disable narrowly only when the full chain is still obviously the clearest expression of the transformation and introducing locals would reduce clarity rather than improve it.
