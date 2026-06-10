# no-complex-boolean-assignments

Avoid staging dense boolean flag expressions in a single variable assignment.

## Why This Rule Exists

Boolean flags often become unreadable when one assignment mixes long `&&` and `||` chains, nested grouping, and multiple negated checks.

At that point the variable name stops helping because the reader still has to mentally execute the whole condition tree to understand when the flag turns on.

## What It Reports

It warns when a boolean-like variable assignment stages a logical expression that is too dense for a single flag assignment.

The default heuristic is intentionally narrow:

- it only considers identifiers that look like boolean flags, such as `isReady`, `hasAccess`, `canSubmit`, or `confirmButtonDisabled`
- it also considers variables with an explicit TypeScript `boolean` annotation
- it reports when the assignment either exceeds the logical-expression threshold or mixes `&&` and `||` across a sufficiently large nested group

It does not report small two-part checks such as `const isReady = hasPlan && canSubmit`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-boolean-assignments`
- Category: Control flow and branching
- `recommended`: included
- `strict`: included
- `pilot`: included

## Source of Truth

- Implementation: [no-complex-boolean-assignments.js](../../rules/no-complex-boolean-assignments.js)
- Tests:
  - [tests/rules/no-complex-boolean-assignments.test.js](../../tests/rules/no-complex-boolean-assignments.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `namePattern` (default: boolean flag prefixes/suffixes) — regex used to decide which identifiers should be treated as boolean-like names.
- `maxLogicalExpressions` (default: `2`) — maximum number of `&&` / `||` logical-expression nodes allowed before reporting.
- `minMixedOperatorLogicalExpressions` (default: `3`) — minimum number of `&&` / `||` logical-expression nodes required before a mixed-operator expression is reported.
- `minMixedOperatorDepth` (default: `2`) — minimum nested logical depth required before a mixed `&&` + `||` expression is reported.

## Examples

### ❌ Incorrect

```tsx
const confirmButtonDisabled =
  !targetPlan ||
  isSubmitting ||
  (!checkoutError && (!quote || dialogState === "loading-quote" || !quoteMatchesCadence));
```

```tsx
isUpgradeDisabled =
  !targetPlan ||
  !billingReady ||
  (hasCheckoutError && (!quote || !quoteMatchesCadence));
```

```ts
const disabled: boolean =
  isArchived ||
  isPendingDeletion ||
  isLocked ||
  isMissingPermissions;
```

### ✅ Correct

```tsx
const isMissingQuote =
  !checkoutError &&
  (!quote || dialogState === "loading-quote" || !quoteMatchesCadence);

const confirmButtonDisabled =
  !targetPlan || isSubmitting || isMissingQuote;
```

```tsx
const requiresQuote = !checkoutError && (!quote || !quoteMatchesCadence);
const isUpgradeDisabled = !targetPlan || !billingReady || requiresQuote;
```

```ts
const shouldBlockAction =
  isArchived ||
  isPendingDeletion ||
  isLocked ||
  isMissingPermissions;

if (shouldBlockAction) {
  return
}
```

## Refactor Direction

Split the boolean into one or two named intermediate guards so each line describes one idea instead of one packed condition tree.

Good moves:

- extract the hardest nested group into a helper or intermediate `const`
- invert one branch so the final flag reads as a small OR-chain or AND-chain
- replace the staged boolean with explicit early-return control flow when the condition really owns a workflow branch

## When To Disable

Disable when the boolean assignment is already the clearest representation available, the condition is stable and domain-specific, and splitting it would only create indirection without reducing cognitive load.
