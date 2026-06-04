# no-deep-control-flow-nesting

Limit nested control-flow depth and nested loops inside functions.

## Why This Rule Exists

Deeply nested control flow is difficult to review and risky to modify because each new condition multiplies the number of paths a reader has to hold in working memory.

## What It Reports

It counts nested statements such as `if`, `switch`, and loops while avoiding common false positives like guard-style early exits and `else if` chains.

## Meridian Profile Status

- Rule ID: `meridian-local/no-deep-control-flow-nesting`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-deep-control-flow-nesting.js](../../rules/no-deep-control-flow-nesting.js)
- Tests:
  - [tests/rules/no-deep-control-flow-nesting.test.js](../../tests/rules/no-deep-control-flow-nesting.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `maxDepth` (default: `2`) — max control-nesting depth.
- `maxLoopDepth` (default: `1`) — max nested loops.
- `ignoreGuardClauses` (default: `true`) — ignore single return/throw/break/continue guards.
- `trackedNodeTypes` (default: `["IfStatement","SwitchStatement","ForStatement","ForInStatement","ForOfStatement","WhileStatement","DoWhileStatement"]`)

## Examples

### ❌ Incorrect

```js
if (a) {
  if (b) {
    if (c) {
      doThing();
    }
  }
}
```

### ✅ Correct

```js
const rows = [a, b, c].filter(Boolean);
if (rows.length) doThing();
```

## Edge Cases and False Positives

- Guard-style early exits are intentionally treated as a readability win, so flattening with `return`, `throw`, `break`, or `continue` is usually the preferred fix.
- Deep nesting can still be legitimate for an algorithmic walk or parser. In those cases, document the shape and disable narrowly instead of weakening the threshold repo-wide.

## Refactor Direction

Flatten the function with guard clauses, extract nested work into helpers, or split loop preparation from loop execution.

## When To Disable

Disable only when the nesting directly mirrors an unavoidable domain algorithm and flattening it would obscure the actual control structure.
