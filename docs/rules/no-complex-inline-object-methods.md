# no-complex-inline-object-methods

Flag inline object-literal methods that contain too much branching, logical expressions, or nested functions.

## Why This Rule Exists

Inline object methods often appear in store definitions, config objects, and action maps. They become hard to maintain when they pack in branching, logical expressions, or nested helpers while still pretending to be just a property value.

## What It Reports

It catches inline object-literal methods whose internal logic is dense even if the method is not especially long.

## Meridian Profile Status

- Rule ID: `meridian-local/no-complex-inline-object-methods`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-complex-inline-object-methods.js](no-complex-inline-object-methods.js)
- Tests:
  - [tests/rules/no-complex-inline-object-methods.test.js](tests/rules/no-complex-inline-object-methods.test.js)

## Rule Options

- `maxComplexitySignals` (default: `2`)
- `countLogicalExpressions` (default: `true`)
- `countNestedFunctions` (default: `true`)

## Examples

### ❌ Incorrect

```js
const config = {
  build: (item) => item?.value || (item.active && item.ready ? format(item) : null)
};
```

### ✅ Correct

```js
const build = (item) => item.value;
const config = { build };
```

## Refactor Direction

Extract the method body into a top-level helper or split one overloaded method into smaller named operations before assigning it on the object.

## When To Disable

Disable when the method is genuinely object-local and the extracted helper would only duplicate the surrounding object vocabulary.
