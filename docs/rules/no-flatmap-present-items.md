# no-flatmap-present-items

Reject `flatMap` callbacks that only express present/absent filtering as `[item]` vs `[]`.

## Why This Rule Exists

Using `flatMap` to express “one item or no items” through `[value]` versus `[]` is clever but indirect. Most readers need a second pass to realize the code is really filtering and mapping at the same time.

## What It Reports

It targets the specific present-item compaction pattern where a `flatMap` callback returns a single-item array or an empty array.

## Meridian Profile Status

- Rule ID: `meridian-local/no-flatmap-present-items`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-flatmap-present-items.js](no-flatmap-present-items.js)
- Tests:
  - [tests/rules/no-flatmap-present-items.test.js](tests/rules/no-flatmap-present-items.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no configurable options.

## Examples

### ❌ Incorrect

```js
items.flatMap((item) => (item.visible ? [item] : []));
```

### ✅ Correct

```js
const visibleItems = [];
for (const item of items) {
  if (item.visible) visibleItems.push(item);
}
```

## Refactor Direction

Switch to a clearer `filter(...).map(...)`, or extract the branch into a helper if the combined operation is still the better algorithmic fit.

## When To Disable

Disable when the surrounding pipeline already relies on `flatMap` semantics and the present-item pattern is established, explicit, and materially clearer in local context.
