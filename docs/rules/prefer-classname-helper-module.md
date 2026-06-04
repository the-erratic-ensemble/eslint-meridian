# prefer-classname-helper-module

Prefer extracting complex class name logic into named helpers/modules instead of inline expressions.

## Why This Rule Exists

Large class name expressions are difficult to review, especially when they encode state combinations, design-system knowledge, and component-specific styling in one inline expression.

## What It Reports

It nudges complex class name logic toward extracted helpers or modules rather than leaving it embedded at the call site.

## Meridian Profile Status

- Rule ID: `meridian-local/prefer-classname-helper-module`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [prefer-classname-helper-module.js](prefer-classname-helper-module.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `propNames` (default: `["className"]`)
- `classHelperNames` (default: `["clsx", "cx", "cn", "classNames"]`)
- `maxHelperArgs` (default: `3`)
- `maxTemplateExpressions` (default: `2`)

## Examples

### ❌ Incorrect

```jsx
<div className={clsx(base, isDark ? "dark" : null, isBusy ? "busy" : null, active ? "active" : null)} />
```

### ✅ Correct

```jsx
const cardClassName = (props) => clsx(base, props.isDark && "dark", props.isBusy && "busy");
<div className={cardClassName({ isDark, isBusy })} />;
```

## Edge Cases and False Positives

- The intent is to stop large style-decision trees from living inline in JSX, not to force a helper for a tiny two-token class merge.
- If the class logic depends on reusable design-system vocabulary, a helper module is usually clearer than repeating the same `cn(...)` condition tree across call sites.

## Refactor Direction

Create a helper or variant module that names the styling decision, then keep JSX focused on structure and state wiring.

## When To Disable

Disable when the class expression is already short, local, and clearer inline than through an extra helper layer.
