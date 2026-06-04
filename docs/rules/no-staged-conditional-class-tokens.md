# no-staged-conditional-class-tokens

Warn when conditional class-token variables are staged before JSX and then injected into `className`.

## Why This Rule Exists

Conditional class decisions are easiest to review when the variant contract is named at the component boundary, not hidden in nearby string variables. Staging conditional class tokens before JSX can make the markup look simple while the styling state machine remains ad hoc.

## What It Reports

It reports JSX `className` props that reference a local variable whose name looks class-related and whose initializer contains conditional logic.

## Meridian Profile Status

- Rule ID: `meridian-local/no-staged-conditional-class-tokens`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-staged-conditional-class-tokens.js](../../rules/no-staged-conditional-class-tokens.js)
- Tests:
  - [tests/rules/no-staged-conditional-class-tokens.test.js](../../tests/rules/no-staged-conditional-class-tokens.test.js)

## Rule Options

- `propNames` (default: `["className"]`)
- `namePattern` (default: `"(?:className|Class|Classes|ClassName)$"`)
- `logicalOperators` (default: `["&&", "||", "??"]`)

## Examples

### ❌ Incorrect

```tsx
function SearchModeButton({ active }) {
  const modePillClass = active
    ? "bg-white text-brand-950"
    : "text-white/60 hover:text-white";

  return <button className={`rounded px-2 ${modePillClass}`}>Live</button>;
}
```

### ✅ Correct

```tsx
const searchModeButtonVariants = cva("rounded px-2", {
  variants: {
    state: {
      active: "bg-white text-brand-950",
      idle: "text-white/60 hover:text-white",
    },
  },
});

function SearchModeButton({ active }) {
  return (
    <button
      className={searchModeButtonVariants({
        state: active ? "active" : "idle",
      })}
    >
      Live
    </button>
  );
}
```

## Edge Cases and False Positives

- This rule is intentionally name-driven. It only tracks variables whose names match `namePattern`.
- Stable, unconditional class constants are allowed.
- If a component already uses an established variant helper that returns a final class string, prefer naming that helper instead of staging one-off conditional class variables.

## Refactor Direction

Move the styling branch into `cva`, `class-variance-authority`, or a focused variant module so JSX receives a named variant result rather than an ad hoc conditional token.

## When To Disable

Disable only when a conditional class token is genuinely temporary and extracting a variant helper would add more indirection than clarity.
