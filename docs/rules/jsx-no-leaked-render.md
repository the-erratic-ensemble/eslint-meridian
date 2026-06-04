# jsx-no-leaked-render

Disallow potentially leaked non-boolean values in JSX render paths.

## Why This Rule Exists

React renders some falsy values, such as `0` and `NaN`, when they leak through `&&` render expressions. JSX conditions should either be explicit booleans or use a ternary/null branch so the render path cannot accidentally output data meant only as a guard.

## What It Reports

It flags `&&` expressions directly inside JSX expression containers when the left side is not an explicit boolean-like expression. It also supports the upstream `validStrategies` option shape for projects that want to report ternary/null render paths instead.

## Meridian Profile Status

- Rule ID: `meridian-local/jsx-no-leaked-render`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [jsx-no-leaked-render.js](../../rules/jsx-no-leaked-render.js)
- Tests:
  - [tests/rules/jsx-no-leaked-render.test.js](../../tests/rules/jsx-no-leaked-render.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `validStrategies`: array of allowed render guard strategies. Defaults to `["ternary", "coerce"]`.

## Examples

### ❌ Incorrect

```jsx
<section>{itemCount && <Results />}</section>
```

### ✅ Correct

```jsx
<section>{itemCount > 0 && <Results />}</section>
```

```jsx
<section>{Boolean(itemCount) && <Results />}</section>
```

```jsx
<section>{itemCount ? <Results /> : null}</section>
```

## Refactor Direction

Use an explicit boolean condition, boolean coercion, or a ternary branch that returns `null` for the hidden state.

## When To Disable

Disable only when the expression is known to be boolean at runtime and a larger refactor would make the surrounding JSX harder to scan.
