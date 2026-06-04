# no-inline-conditional-styles

Avoid inline conditional style logic in JSX (`className`, `class`, etc.) and move to a helper/cva layer.

## Why This Rule Exists

Inline conditional class and style logic tends to sprawl across JSX attributes and quickly becomes harder to maintain than the underlying component itself.

## What It Reports

It flags conditional style expressions in JSX attributes such as `className` or `class` so styling decisions can move into helpers, variants, or style modules.

## Meridian Profile Status

- Rule ID: `meridian-local/no-inline-conditional-styles`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-inline-conditional-styles.js](no-inline-conditional-styles.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `propNames` (default: `["className"]`)
- `functionNames` (default: `["clsx", "cx", "cn"]`)
- `disallowTernary` (default: `true`)
- `disallowLogicalAnd` (default: `false`)
- `disallowLogicalOr` (default: `false`)
- `allowSimpleIdentifierFallbacks` (default: `true`)

## Examples

### ❌ Incorrect

```jsx
<button className={isActive ? "btn btn-active" : "btn"}>Save</button>
```

### ✅ Correct

```jsx
const buttonClass = buildButtonClass({ isActive });
<button className={buttonClass}>Save</button>;
```

## Meridian-Style Example

### Before

```tsx
function AreaCard({ isSelected, intent, areaType }) {
  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3",
        isSelected ? "border-brand-600 bg-brand-50" : "border-slate-200",
        intent === "warning" ? "text-amber-900" : "text-slate-900",
        areaType === "postcode" ? "shadow-sm" : "shadow-none"
      )}
    />
  );
}
```

### After

```tsx
function getAreaCardClassName({ isSelected, intent, areaType }) {
  return cn(
    "rounded-xl border px-4 py-3",
    isSelected ? "border-brand-600 bg-brand-50" : "border-slate-200",
    intent === "warning" ? "text-amber-900" : "text-slate-900",
    areaType === "postcode" ? "shadow-sm" : "shadow-none"
  );
}

function AreaCard(props) {
  return <article className={getAreaCardClassName(props)} />;
}
```

## Edge Cases and False Positives

- Small identifier fallbacks are intentionally allowed by default. This rule is aimed at branching style assembly, not every short `cn(...)` call.
- Once a component starts combining status, emphasis, and size logic in the same `className`, move that decision into a helper or variant map instead of stacking more ternaries.

## Refactor Direction

Extract a class helper, use a variant utility, or compute the style token before the JSX and pass a named value into the prop.

## When To Disable

Disable when the condition is tiny, local, and more readable inline than in a dedicated helper or variant map.
