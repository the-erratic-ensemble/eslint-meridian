# no-inline-object-literals-in-jsx

Discourage inline object literals in JSX props to keep prop shapes explicit and reusable.

## Why This Rule Exists

Inline object literals in JSX make prop contracts harder to inspect because readers have to parse shape creation and component usage at the same time. They also encourage unstable ad hoc prop objects instead of named values.

## What It Reports

It reports object literal expressions passed inline through JSX props.

## Meridian Profile Status

- Rule ID: `meridian-local/no-inline-object-literals-in-jsx`
- Category: JSX and styling hygiene
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-inline-object-literals-in-jsx.js](../../rules/no-inline-object-literals-in-jsx.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `propNames` (default: `[]`) — empty means all props.
- `allowSimpleObjects` (default: `false`) — allow trivial values only (`{ key, obj.foo }` style).

## Examples

### ❌ Incorrect

```jsx
<Card options={{ title: "Search", compact: true, onSubmit }} />
```

### ✅ Correct

```jsx
const cardOptions = { title: "Search", compact: true, onSubmit };
<Card options={cardOptions} />;
```

## Meridian-Style Example

### Before

```tsx
function SearchResults({ rows, selectedAreaId }) {
  return (
    <ResultsTable
      rows={rows}
      filters={{ selectedAreaId, includeArchived: false, mode: "postcode" }}
    />
  );
}
```

### After

```tsx
function SearchResults({ rows, selectedAreaId }) {
  const tableFilters = {
    selectedAreaId,
    includeArchived: false,
    mode: "postcode",
  };

  return <ResultsTable rows={rows} filters={tableFilters} />;
}
```

## Edge Cases and False Positives

- This rule is currently a pilot-only rollout guard. Treat warnings as a signal to evaluate prop-shape clarity, not as proof that every small inline object must disappear immediately.
- If the object is static and one-off, a local disable can be more honest than inventing a meaningless constant name just to satisfy the rule.

## Refactor Direction

Hoist the object into a named constant, extract a helper, or redesign the receiving component so the call site passes clearer primitive or structured props.

## When To Disable

Disable when the object is tiny, static, and obviously local to a single one-off call site.
