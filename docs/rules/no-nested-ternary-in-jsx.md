# no-nested-ternary-in-jsx

Disallow nested ternaries directly in JSX render paths.

## Why This Rule Exists

Nested ternaries in JSX compress multiple UI branches into a shape that is concise for the author and noisy for the next reader. Render logic should optimize for scanability, not minimum characters.

## What It Reports

It flags ternaries nested directly inside JSX render paths.

## Meridian Profile Status

- Rule ID: `meridian-local/no-nested-ternary-in-jsx`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-nested-ternary-in-jsx.js](no-nested-ternary-in-jsx.js)
- Tests:
  - [tests/rules/no-nested-ternary-in-jsx.test.js](tests/rules/no-nested-ternary-in-jsx.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no configurable options.

## Examples

### ❌ Incorrect

```jsx
<span>{user ? (user.name ? user.name : "—") : "Guest"}</span>
```

### ✅ Correct

```jsx
const name = user ? (user.name ?? "—") : "Guest";
<span>{name}</span>;
```

## Refactor Direction

Use explicit conditionals, extract a helper component, or compute a named display state before returning JSX.

## When To Disable

Disable when the nested ternary is unusually small, symmetric, and still clearer than the expanded alternative.
