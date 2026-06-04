# no-long-if-else-chain

Limit long `if/else if` chains and heavy assignment/write activity in those chains.

## Why This Rule Exists

Long branch chains often indicate that a lookup table, strategy map, or helper boundary would communicate intent better than a growing cascade of conditional writes.

## What It Reports

It flags lengthy `if` / `else if` chains, with extra sensitivity to chains that also perform multiple assignments or writes.

## Meridian Profile Status

- Rule ID: `meridian-local/no-long-if-else-chain`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-long-if-else-chain.js](../../rules/no-long-if-else-chain.js)
- Tests:
  - [tests/rules/no-long-if-else-chain.test.js](../../tests/rules/no-long-if-else-chain.test.js)

## Rule Options

- `maxChainLength` (default: `2`)
- `maxBranchWrites` (default: `2`)

## Examples

### ❌ Incorrect

```js
if (status === "new") {
  steps = ["step"];
} else if (status === "edit") {
  steps = ["step", "validate"];
} else if (status === "error") {
  steps = ["retry"];
}
```

### ✅ Correct

```js
const map = {
  new: ["step"],
  edit: ["step", "validate"],
  error: ["retry"],
};
const steps = map[status] ?? [];
```

## Refactor Direction

Replace the chain with a lookup object, split the logic into smaller helpers, or use guard clauses to separate unrelated cases.

## When To Disable

Disable when the chain directly models ordered business rules and collapsing it into a data structure would make precedence harder to understand.
