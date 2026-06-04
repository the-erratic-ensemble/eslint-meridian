# no-complex-inline-handlers

Prevent complex inline JSX handlers and inline prop IIFEs from staying in JSX attributes.

## Why This Rule Exists

Inline handlers are convenient until they start carrying branching, setup work, or ad hoc orchestration. At that point the JSX stops reading like UI and starts reading like controller code.

## What It Reports

It targets JSX attribute handlers and inline prop IIFEs that contain too much logic to remain readable inline.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-inline-handlers`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-inline-handlers.js](../../rules/no-complex-inline-handlers.js)
- Tests:
  - [tests/rules/no-complex-inline-handlers.test.js](../../tests/rules/no-complex-inline-handlers.test.js)

## Rule Options

- `propPattern` (default: `"^on[A-Z]"`) — which props are treated as handlers.
- `maxBodyLines` (default: `2`)
- `maxStatements` (default: `1`)
- `allowSimpleExpressions` (default: `true`)
- `disallowVariableDeclarations` (default: `true`)
- `disallowControlFlow` (default: `true`)
- `disallowNestedFunctions` (default: `true`)
- `ignoreDOMElements` (default: `false`)

## Examples

### ❌ Incorrect

```jsx
<button
  onClick={(event) => {
    const target = event.currentTarget;
    if (target.disabled) return;
    save(target.value);
  }}
>
  Save
</button>
```

### ✅ Correct

```jsx
<button onClick={handleSave}>Save</button>
```

## Refactor Direction

Extract a named event handler or precompute the value before the JSX so the prop reads as intent instead of implementation.

## When To Disable

Disable when the inline handler is still short, local, and easier to verify in place than as a separately named function.
