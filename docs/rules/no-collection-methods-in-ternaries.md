# no-collection-methods-in-ternaries

Do not hide collection transformations inside ternary branches.

## Why This Rule Exists

A ternary is already a branch. Hiding `map`, `filter`, or similar collection work inside each branch compresses both branching and shaping into one expression and forces the reader to decode too much at once.

## What It Reports

It reports ternary branches that perform collection transformations inline. This is especially useful for render preparation code where branch intent matters more than expression compactness.

## Meridian Profile Status

- Rule ID: `meridian-local/no-collection-methods-in-ternaries`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-collection-methods-in-ternaries.js](../../rules/no-collection-methods-in-ternaries.js)
- Tests:
  - [tests/rules/no-collection-methods-in-ternaries.test.js](../../tests/rules/no-collection-methods-in-ternaries.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "reduce", "flatMap", "find", "some", "every"]`) — methods checked inside branches.

## Examples

### ❌ Incorrect

```js
const visible = isAdmin
  ? rows.filter((row) => row.visible)
  : rows.map((row) => row.visible);
```

### ✅ Correct

```js
const baseRows = isAdmin ? rows : rows;
const visible = isAdmin ? rows.filter(...) : rows;
```

## Refactor Direction

Move the branch outside the collection operation or compute each candidate result in a named variable before the final conditional.

## When To Disable

Disable when the branch is very small, symmetric, and materially clearer as a single expression than as staged statements.
