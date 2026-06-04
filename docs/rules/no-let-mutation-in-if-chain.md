# no-let-mutation-in-if-chain

Catch initialized `let` variables that are immediately mutated in an `if/else` chain.

## Why This Rule Exists

Initialize-then-mutate patterns across `if` / `else if` chains make the eventual value harder to reason about because the variable meaning depends on tracing writes through control flow.

## What It Reports

It catches `let` variables that are declared and then reassigned within a following branch chain.

## Meridian Profile Status

- Rule ID: `meridian-local/no-let-mutation-in-if-chain`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-let-mutation-in-if-chain.js](../../rules/no-let-mutation-in-if-chain.js)
- Tests:
  - [tests/rules/no-let-mutation-in-if-chain.test.js](../../tests/rules/no-let-mutation-in-if-chain.test.js)

## Rule Options

- `requireElseBranch` (default: `false`)
- `minBranchMutations` (default: `1`) — minimum mutated branches needed to report.

## Examples

### ❌ Incorrect

```js
let value = deriveInput(input);
if (isReady) {
  value = normalize(value);
} else if (hasDefault) {
  value = "default";
}
```

### ✅ Correct

```js
const source = deriveInput(input);
const value = isReady ? normalize(source) : hasDefault ? "default" : source;
```

## Refactor Direction

Return early, compute each branch directly, or assign once from an extracted helper so the variable has a single definition point.

## When To Disable

Disable when staged mutation is the clearest form for a small localized branch and converting it would mostly add nesting or duplication.
