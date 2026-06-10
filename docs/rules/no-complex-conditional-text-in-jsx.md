# no-complex-conditional-text-in-jsx

Avoid dense conditional copy assembly directly inside JSX child text.

## Why This Rule Exists

Inline JSX text becomes hard to scan when one expression mixes branching logic with string assembly.

The visual problem is usually not that the code is invalid. It is that the reader has to parse the condition and the final display copy at the same time while sitting inside markup.

## What It Reports

It warns on JSX child expressions where:

- the expression is a ternary
- at least one branch assembles text inline with a template literal or string concatenation
- the ternary is complex enough to justify moving the display copy out of the markup

By default that means one of these shapes:

- the ternary test uses logical `&&` or `||`
- a text branch contains a template with two or more interpolated expressions

It does not warn on simple JSX text ternaries like ``count > 0 ? `${count} alerts` : "No alerts"``.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-conditional-text-in-jsx`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-conditional-text-in-jsx.js](../../rules/no-complex-conditional-text-in-jsx.js)
- Tests:
  - [tests/rules/no-complex-conditional-text-in-jsx.test.js](../../tests/rules/no-complex-conditional-text-in-jsx.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `minTemplateExpressions` (default: `2`) — minimum number of interpolated expressions in a template branch before it is considered complex.
- `reportLogicalTests` (default: `true`) — whether ternary tests that use logical `&&` / `||` should be reported when the branches assemble inline text.

## Examples

### ❌ Incorrect

```tsx
<p>
  {criticalFeatures.length > 0 || warningFeatures.length > 0
    ? `${criticalFeatures.length} critical · ${warningFeatures.length} warning`
    : "No alerts"}
</p>
```

```tsx
<p>{showSummary ? `${used} used · ${remaining} left` : "No usage yet"}</p>
```

### ✅ Correct

```tsx
const alertSummaryLabel =
  criticalFeatures.length > 0 || warningFeatures.length > 0
    ? `${criticalFeatures.length} critical · ${warningFeatures.length} warning`
    : "No alerts";

<p>{alertSummaryLabel}</p>;
```

```tsx
const alertSummaryLabel = getAlertSummaryLabel({
  criticalCount: criticalFeatures.length,
  warningCount: warningFeatures.length,
});

<p>{alertSummaryLabel}</p>;
```

```tsx
<p>{count > 0 ? `${count} alerts` : "No alerts"}</p>
```

## Refactor Direction

Prepare the display text before the JSX with a named local or helper so the markup only renders the result.

This keeps the copy decision visible without forcing the reader to parse a branching expression inside the text node itself.

## When To Disable

Disable when the inline text ternary is truly tiny and extracting it would add more indirection than clarity.
