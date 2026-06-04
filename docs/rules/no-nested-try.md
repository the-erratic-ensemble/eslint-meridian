# no-nested-try

Disallow nested `try` blocks within the same execution frame.

## Why This Rule Exists

Nested `try` blocks blur error ownership. Once rollback, cleanup, parsing fallback, or secondary side effects get wrapped in their own `try` inside another error boundary, it becomes difficult to tell which failure path owns recovery and which error should actually escape.

## What It Reports

It reports `try` blocks nested inside another `try`, `catch`, or `finally` path within the same function scope.

The rule intentionally does not cross function boundaries, so helper callbacks and nested functions are treated as separate execution frames rather than as more nesting inside the outer `try`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-nested-try`
- Category: Control flow and branching
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-nested-try.js](../../rules/no-nested-try.js)
- Tests:
  - [tests/rules/no-nested-try.test.js](../../tests/rules/no-nested-try.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `maxDepth` (default: `1`) — maximum allowed nested `try` depth within one execution frame. `1` means one `try` block is allowed, but a nested second `try` is reported.
- `trackedAncestorBlocks` (default: `["try", "catch", "finally"]`) — which outer sections count as disallowed nesting containers.

## Examples

### ❌ Incorrect

```js
async function createAndSave() {
  try {
    const workspace = await createWorkspace();

    try {
      await saveWorkspaceSelection(workspace.id);
    } catch (error) {
      await rollbackWorkspace(workspace.id);
      report(error);
    }
  } catch (error) {
    report(error);
  }
}
```

```js
async function refreshSession() {
  try {
    await persistSession();
  } catch (error) {
    try {
      await rollbackSession();
    } catch (rollbackError) {
      report(rollbackError);
    }
  }
}
```

### ✅ Correct

```js
async function saveWorkspaceSelectionWithRollback(workspaceId) {
  try {
    await saveWorkspaceSelection(workspaceId);
  } catch (error) {
    const rollbackSucceeded = await rollbackWorkspace(workspaceId);
    throw new SaveWorkspaceSelectionError(error, { rollbackSucceeded });
  }
}

async function createAndSave() {
  try {
    const workspace = await createWorkspace();
    await saveWorkspaceSelectionWithRollback(workspace.id);
  } catch (error) {
    report(error);
  }
}
```

```js
async function refreshSession() {
  try {
    await persistSession();
  } catch (error) {
    await rollbackSession().catch((rollbackError) => {
      report(rollbackError);
    });
  }
}
```

## Edge Cases and False Positives

- Nested functions are ignored on purpose. A helper declared inside a `try` block has its own error boundary and should be judged independently.
- Sibling `try` blocks are not reported. The rule only cares about nested ancestry, not multiple independent `try` statements in one function.
- If one surface intentionally allows `try` inside `catch` but still wants to ban `try` inside `try`, narrow `trackedAncestorBlocks` instead of disabling the rule repo-wide.

## Refactor Direction

Extract the inner failure-prone work into a helper with its own contract, or collapse the recovery path so one `try` owns one error-handling boundary.

## When To Disable

Disable narrowly only when the nested `try` reflects an unavoidable external API boundary and extracting it would make the ownership of the two failure paths less clear rather than more clear.
