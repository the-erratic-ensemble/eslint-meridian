# no-render-time-date-in-jsx

Warn when JSX render output constructs `Date` values inline.

## Why This Rule Exists

Render-time date construction can create non-deterministic UI output, hydration drift, and hard-to-test snapshots. Components should receive prepared time values or compute them outside the JSX expression that describes the rendered structure.

## What It Reports

It reports `new Date()` and configured `Date.*` static calls inside JSX expression containers.

## Meridian Profile Status

- Rule ID: `meridian-local/no-render-time-date-in-jsx`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-render-time-date-in-jsx.js](../../rules/no-render-time-date-in-jsx.js)
- Tests:
  - [tests/rules/no-render-time-date-in-jsx.test.js](../../tests/rules/no-render-time-date-in-jsx.test.js)

## Rule Options

- `staticMethods` (default: `["now"]`)

## Examples

### ❌ Incorrect

```tsx
function Footer() {
  return <footer>{new Date().getFullYear()}</footer>;
}
```

### ✅ Correct

```tsx
function Footer({ currentYear }) {
  return <footer>{currentYear}</footer>;
}
```

## Edge Cases and False Positives

- The rule only checks JSX expression containers. Date construction in event handlers, effects, or service code is outside this rule's scope.
- Add extra static methods through `staticMethods` only when the method produces render-time volatility in the target surface.

## Refactor Direction

Pass a prepared date or year into the component, or compute the value outside the JSX expression and make the ownership explicit.

## When To Disable

Disable only for intentionally volatile UI such as a live clock where render-time freshness is the feature and hydration behavior is already handled.
