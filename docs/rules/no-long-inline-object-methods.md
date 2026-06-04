# no-long-inline-object-methods

Flag inline object-literal methods whose non-blank body exceeds the configured line limit.

## Why This Rule Exists

Long inline methods inside object literals are easy to create and difficult to maintain because the object shape and the implementation details compete for attention.

## What It Reports

It measures inline object-literal methods by body length, ignoring blank and comment-only lines so the threshold reflects real code.

## Meridian Profile Status

- Rule ID: `meridian-local/no-long-inline-object-methods`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-long-inline-object-methods.js](no-long-inline-object-methods.js)
- Tests:
  - [tests/rules/no-long-inline-object-methods.test.js](tests/rules/no-long-inline-object-methods.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `maxBodyLines` (default: `3`)

## Examples

### ❌ Incorrect

```js
const store = {
  fetchAutocomplete: () => {
    const valid = validateSearchQuery();
    if (!valid) return;
    log(valid);
    persist(valid);
  }
};
```

### ✅ Correct

```js
function fetchAutocomplete() {
  const valid = validateSearchQuery();
  if (!valid) return;
  log(valid);
}

const store = { fetchAutocomplete };
```

## Refactor Direction

Extract the method to a named helper or split one long action into smaller operations before assigning it on the object.

## When To Disable

Disable when the object is intentionally acting as a small local module and extracting the method would make the surrounding structure less coherent.
