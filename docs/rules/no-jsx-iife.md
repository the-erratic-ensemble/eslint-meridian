# no-jsx-iife

Avoid immediately-invoked function expressions inside JSX.

## Why This Rule Exists

IIFEs inside JSX hide imperative setup work in the middle of the render path. They are often used to smuggle variable declarations, branching, or mini render helpers into returned markup without extracting a component or staging the value earlier.

That shape is hard to scan, and it also creates a loophole around stricter JSX callback rules.

## What It Reports

It warns when JSX contains an immediately-invoked function expression, including:

- direct child expressions like `{(() => computeLabel())()}`
- JSX attribute expressions like `aria-label={(() => computeLabel())()}`
- IIFEs nested inside JSX collection callbacks

## Meridian Profile Status

- Rule ID: `meridian-local/no-jsx-iife`
- Category: JSX and styling hygiene
- `recommended`: not included
- `strict`: not included
- `pilot`: not included

## Source of Truth

- Implementation: [no-jsx-iife.js](../../rules/no-jsx-iife.js)
- Tests:
  - [tests/rules/no-jsx-iife.test.js](../../tests/rules/no-jsx-iife.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)

## Rule Options

This rule has no options.

## Examples

### ❌ Incorrect

```tsx
return <div>{(() => formatSummary(model))()}</div>;
```

```tsx
return <Card aria-label={(() => computeLabel(metric))()} />;
```

```tsx
return (
  <div>
    {modules.map((module) =>
      (() => {
        const bodyContent = moduleBodyContent(module);

        return <ArticleCard title={module.title}>{bodyContent}</ArticleCard>;
      })(),
    )}
  </div>
);
```

### ✅ Correct

```tsx
const summary = formatSummary(model);
return <div>{summary}</div>;
```

```tsx
const ariaLabel = computeLabel(metric);
return <Card aria-label={ariaLabel} />;
```

```tsx
const renderModuleCard = (module: DomainPageModule) => (
  <ArticleCard title={module.title}>{moduleBodyContent(module)}</ArticleCard>
);

return <div>{modules.map(renderModuleCard)}</div>;
```

## Refactor Direction

Stage the derived value before the JSX, extract a named render helper, or extract a component when the JSX block has its own responsibility.

## When To Disable

Disable only when the IIFE is genuinely the smallest clear representation and extracting it would make the surrounding code less legible.
