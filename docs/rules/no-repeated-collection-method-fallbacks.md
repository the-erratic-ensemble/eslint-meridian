# no-repeated-collection-method-fallbacks

Avoid repeating derived collection calls on the same receiver inside `??` / `||` fallback chains.

## Why This Rule Exists

Repeatedly searching or transforming the same collection inside one fallback chain is a strong readability smell. It forces readers to compare near-duplicate expressions instead of seeing the intended search sequence clearly.

## What It Reports

It tracks repeated collection method calls on the same receiver across `??` and `||` fallback chains.

## Meridian Profile Status

- Rule ID: `meridian-local/no-repeated-collection-method-fallbacks`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-repeated-collection-method-fallbacks.js](../../rules/no-repeated-collection-method-fallbacks.js)
- Tests:
  - [tests/rules/no-repeated-collection-method-fallbacks.test.js](../../tests/rules/no-repeated-collection-method-fallbacks.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["find", "map", "filter", "reduce", "flatMap", "some", "every"]`)
- `operators` (default: `["??", "||"]`)

## Examples

### ❌ Incorrect

```js
const item = rows.find(match) ?? rows.find(fallback);
```

### ✅ Correct

```js
const matches = rows.find((row) => match(row) || fallback(row));
const item = matches ?? defaultItem;
```

## Refactor Direction

Stage each derived result in a named local, or restructure the search logic so the preferred source and fallback source are explicit.

## When To Disable

Disable when the repeated calls are extremely small and the chain is still more direct than introducing extra names.
