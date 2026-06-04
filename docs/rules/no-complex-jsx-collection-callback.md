# no-complex-jsx-collection-callback

Keep JSX collection callbacks (`map`, `flatMap`, etc.) simple and mostly expression-shaped.

## Why This Rule Exists

JSX collection callbacks sit directly in the render path, so even modest extra branching quickly makes the UI harder to scan. This rule keeps render callbacks close to declarative markup rather than embedding miniature control flow blocks in JSX.

## What It Reports

It inspects collection callbacks used in JSX and enforces a tighter simplicity threshold than the general collection callback rule.
It also inspects collection calls nested inside JSX conditionals or logical expressions, such as `{ready ? rows.map(...) : null}`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-jsx-collection-callback`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-jsx-collection-callback.js](../../rules/no-complex-jsx-collection-callback.js)
- Tests:
  - [tests/rules/no-complex-jsx-collection-callback.test.js](../../tests/rules/no-complex-jsx-collection-callback.test.js)

## Rule Options

- `methods` (default: `["map", "flatMap"]`)
- `disallowBlockBody` (default: `true`)
- `maxStatements` (default: `1`)
- `disallowVariableDeclarations` (default: `true`)
- `disallowIf` (default: `true`)
- `disallowSwitch` (default: `true`)
- `disallowInlineHandlerBlocks` (default: `true`)
- `maxReturnedJsxDepth` (default: `2`)

## Examples

### ❌ Incorrect

```jsx
items.map((item) => {
  const display = item.label.trim();
  if (!display) return null;
  return <Tile title={display}>{item.value}</Tile>;
});
```

### ✅ Correct

```jsx
const renderItem = (item) =>
  item.label?.trim() ? <Tile title={item.label} /> : null;
items.map(renderItem);
```

## Refactor Direction

Prepare the rendered items before the JSX, extract a row component, or move the callback into a named helper with a focused responsibility.

## When To Disable

Disable when the callback is the clearest local representation of the UI shape and extraction would fragment a small render path.
