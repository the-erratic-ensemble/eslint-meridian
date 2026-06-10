# no-complex-array-callbacks

Keep collection-method callbacks compact by limiting statements, branching, variable setup, and nested functions.

## Why This Rule Exists

Collection callbacks are easiest to read when they stay expression-shaped and local. Once they start allocating variables, branching, or nesting functions, the transformation itself gets buried inside callback mechanics.

## What It Reports

It watches array methods such as `map`, `filter`, `find`, `some`, `every`, `flatMap`, and `reduce`, then flags callbacks that exceed the configured simplicity limits.

That includes dense predicate callbacks that compress too many boolean checks into one expression-bodied `filter` / `find` / `some` / `every` callback.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-array-callbacks`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-array-callbacks.js](../../rules/no-complex-array-callbacks.js)
- Tests:
  - [tests/rules/no-complex-array-callbacks.test.js](../../tests/rules/no-complex-array-callbacks.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "find", "some", "every", "flatMap", "reduce"]`) — callback targets.
- `requireExpressionBody` (default: `false`)
- `maxStatements` (default: `1`)
- `disallowVariableDeclarations` (default: `true`)
- `disallowIf` (default: `true`)
- `disallowSwitch` (default: `true`)
- `disallowLoops` (default: `true`)
- `disallowNestedFunctions` (default: `true`)
- `disallowTernary` (default: `false`)
- `logicalExpressionMethods` (default: `["filter", "find", "some", "every"]`) — methods whose callbacks should be checked for dense boolean expression bodies.
- `maxLogicalExpressions` (default: `2`) — maximum number of `&&` / `||` logical-expression nodes allowed in those predicate callbacks.
- `skipJsxCollectionMethods` (default: `["map", "flatMap"]`)

## Examples

### ❌ Incorrect

```js
rows.map((row) => {
  const key = row.id;
  if (!key) return null;
  return values[key];
});
```

```js
const fallbackGroups = groups.filter(
  (group) =>
    !usedGroupKeys.has(group.key) &&
    !!group.nearestAmenityName &&
    !!group.nearestDistanceLabel &&
    (group.nearestDistanceMeters ?? 0) > 0,
);
```

### ✅ Correct

```js
const getItemValue = (row) => {
  const key = row.id;
  return values[key];
};
rows.map(getItemValue);
```

```js
const isFallbackGroup = (group) =>
  !usedGroupKeys.has(group.key) &&
  !!group.nearestAmenityName &&
  !!group.nearestDistanceLabel &&
  (group.nearestDistanceMeters ?? 0) > 0;

const fallbackGroups = groups.filter(isFallbackGroup);
```

## Edge Cases and False Positives

- This rule skips JSX `map` and `flatMap` callbacks by default via `skipJsxCollectionMethods`; render-path enforcement typically comes from `no-complex-jsx-collection-callback` instead.
- If a callback is tightly coupled to component-local names, prefer extracting one small named helper before relaxing several thresholds at once.
- For predicate callbacks, the goal is not to ban boolean checks. The goal is to stop one callback from turning into a mini guard pipeline that is harder to scan than a named predicate.

## Refactor Direction

Extract the callback into a named helper or stage preconditions before the collection method so the callback only expresses the actual transformation.

## When To Disable

Disable when the callback is still the clearest place for the logic and extracting it would hide important local context rather than simplify it.
