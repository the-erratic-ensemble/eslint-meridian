# no-complex-hook-callbacks

Keep `useCallback`, `useMemo`, and `useEffect` callbacks small and free of heavy control flow.

## Why This Rule Exists

Hook callbacks should usually describe one reaction, memo computation, or event pipeline. When a `useEffect`, `useMemo`, or `useCallback` body turns into a mini controller, dependency reasoning and future edits become brittle.

## What It Reports

It flags hook callbacks with too much control flow, setup, or nested logic. The rule is aimed at preserving clear dependency boundaries and making extracted helpers the default for heavier work.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-hook-callbacks`
- Category: Hooks and component boundaries
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-hook-callbacks.js](../../rules/no-complex-hook-callbacks.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `hooks` (default: `["useCallback", "useMemo", "useEffect"]`)
- `maxStatements` (default: `5`)
- `maxBranches` (default: `1`)
- `maxVariableDeclarations` (default: `1`)
- `disallowTernary` (default: `false`)
- `disallowNestedTernary` (default: `true`)

## Examples

### ❌ Incorrect

```js
const result = useCallback(() => {
  if (a && b) {
    return computeFrom(a, b, c);
  }
  let count = 0;
  for (const item of items) {
    count += item.value;
  }
  return count ? (count > 10 ? "high" : "low") : "none";
}, [a, b, items]);
```

### ✅ Correct

```js
const normalizeItems = (values) => values.filter(Boolean);
const result = useCallback(() => normalizeItems(items), [items]);
```

## Edge Cases and False Positives

- This rule is a shape heuristic, not a dependency analyzer. Extract heavy computation, but keep effect lifecycle wiring and cleanup close to the hook that owns it.
- If a helper extraction would hide which values a hook actually depends on, keep the dependency-sensitive part local and move only the transformation logic out.

## Refactor Direction

Move complex logic into a helper, derive values before the hook, or split one overloaded hook into smaller responsibilities.

## When To Disable

Disable when the callback is tightly coupled to hook-local variables and a helper would mostly add indirection without reducing complexity.
