# no-deep-optional-chaining-conditions

Discourage overly deep optional-chaining expressions inside conditional tests.

## Why This Rule Exists

Long optional-chaining checks inside conditions often signal that the code is compensating for unclear data shaping or missing preparation. They make branch intent secondary to defensive access syntax.

## What It Reports

It looks for conditional tests that rely on deep optional chains instead of staging the lookup or shaping the data first.

## Meridian Profile Status

- Rule ID: `meridian-local/no-deep-optional-chaining-conditions`
- Category: Control flow and branching
- `recommended`: not included
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-deep-optional-chaining-conditions.js](no-deep-optional-chaining-conditions.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `maxOptionalDepth` (default: `3`)

## Examples

### ❌ Incorrect

```js
if (user?.profile?.address?.country?.code) {
  // ...
}
```

### ✅ Correct

```js
const profile = user?.profile;
if (!profile?.address) return;
if (profile.address.country?.code) {
  // depth reduced by staging
}
```

## Edge Cases and False Positives

- The rule is intended for repeated defensive reach-through in app logic, not to punish one-off integration boundaries. If the chain comes from an external payload, normalize the payload earlier.
- Staging the looked-up value in a local is usually better than splitting the same optional chain across multiple conditions.

## Refactor Direction

Assign the looked-up value to a named variable, normalize the data earlier, or introduce a helper that describes the condition in domain terms.

## When To Disable

Disable when the chain is still the shortest accurate expression of a one-off defensive check and staging the value would not improve readability.
