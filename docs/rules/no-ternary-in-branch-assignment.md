# no-ternary-in-branch-assignment

Disallow ternaries used directly for assignments, declarations, or returns inside `if/else` branches.

## Why This Rule Exists

A ternary inside an `if` branch usually means the code is nesting one branch mechanism inside another. That makes branch intent harder to read than either a flatter conditional or a direct assignment strategy.

## What It Reports

It catches ternaries used for assignments, declarations, or returns inside existing `if` / `else` branches.

## Meridian Profile Status

- Rule ID: `meridian-local/no-ternary-in-branch-assignment`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-ternary-in-branch-assignment.js](../../rules/no-ternary-in-branch-assignment.js)
- Tests:
  - [tests/rules/no-ternary-in-branch-assignment.test.js](../../tests/rules/no-ternary-in-branch-assignment.test.js)

## Rule Options

- `checkAssignments` (default: `true`)
- `checkVariableDeclarations` (default: `true`)
- `checkReturnStatements` (default: `false`)

## Examples

### ❌ Incorrect

```js
if (isReady) {
  value = canEdit ? "edit" : "view";
}
```

### ✅ Correct

```js
if (isReady) {
  value = canEdit ? "edit" : "view";
}
// now extract mode first if needed
const mode = canEdit ? "edit" : "view";
```

## Refactor Direction

Flatten the branch structure or compute the value in one place so there is only one branching mechanism to follow.

## When To Disable

Disable when the inner ternary is genuinely tiny and keeps a single branch expression clearer than the expanded form.
