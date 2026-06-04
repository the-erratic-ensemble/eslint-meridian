# no-conditional-expressions-in-collection-callbacks

Keep callbacks for collection methods from returning object/array structures via nested conditional expressions.

## Why This Rule Exists

A callback that returns object or array structures via a ternary is compact but hard to parse. The reader has to understand both the collection operation and the structured branch result in one go.

## What It Reports

It flags collection callbacks whose body is a conditional expression returning collection-shaped or object-shaped branches.

## Meridian Profile Status

- Rule ID: `meridian-local/no-conditional-expressions-in-collection-callbacks`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-conditional-expressions-in-collection-callbacks.js](no-conditional-expressions-in-collection-callbacks.js)
- Tests:
  - [tests/rules/no-conditional-expressions-in-collection-callbacks.test.js](tests/rules/no-conditional-expressions-in-collection-callbacks.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `methods` (default: `["map", "filter", "find", "some", "every", "reduce"]`)

## Examples

### ❌ Incorrect

```js
items.map((item) => (item.active ? { id: item.id } : { id: null }));
```

### ✅ Correct

```js
const mapItem = (item) => (item.active ? item.id : null);
items.map(mapItem);
```

## Refactor Direction

Use an explicit `if` with a named helper, or split the transformation into filter-plus-map style stages when that better reflects intent.

## When To Disable

Disable when the ternary is the most direct way to express a small structured branch and the surrounding callback stays simple.
