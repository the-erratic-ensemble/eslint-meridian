# no-conditional-collection-initializers

Disallow collection-shaped `ConditionalExpression` initializers; prefer staging collections before branching.

## Why This Rule Exists

Collection-shaped ternaries in variable initializers hide initialization strategy and branch behavior in one compact expression. That makes follow-up changes harder, especially when each branch evolves differently over time.

## What It Reports

It focuses on variable declarations where a ternary produces an array or collection-shaped result directly in the initializer.

## Meridian Profile Status

- Rule ID: `meridian-local/no-conditional-collection-initializers`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-conditional-collection-initializers.js](../../rules/no-conditional-collection-initializers.js)
- Tests:
  - [tests/rules/no-conditional-collection-initializers.test.js](../../tests/rules/no-conditional-collection-initializers.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "flatMap"]`) — methods treated as derived collections.

## Examples

### ❌ Incorrect

```js
const rows = isReady ? rowsData.map(normalize) : rowsData.filter(valid);
```

### ✅ Correct

```js
const baseRows = isReady ? rowsData.map(normalize) : rowsData.filter(valid);
const rows = baseRows;
```

## Refactor Direction

Initialize the variable with a named branch result, or switch to explicit statements so the branch and collection-building steps are visible separately.

## When To Disable

Disable when the ternary is shallow, both branches are obvious, and the extracted form would be mechanically longer without adding clarity.
