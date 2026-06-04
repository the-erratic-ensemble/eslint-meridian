# react19-no-forwardref

Disallow `React.forwardRef` usage in React 19-first codepaths.

## Why This Rule Exists

React 19 reduces the need for `forwardRef` in many codepaths, and continuing to introduce it by default keeps older wrapper patterns alive longer than necessary.

## What It Reports

It flags new `React.forwardRef` usage so the codebase can favor React 19-first ref patterns.

## Meridian Profile Status

- Rule ID: `meridian-local/react19-no-forwardref`
- Category: Hooks and component boundaries
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [react19-no-forwardref.js](../../rules/react19-no-forwardref.js)
- Tests:
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `allowPathIncludes` (default: `[]`) — filename fragments that bypass reporting.

## Examples

### ❌ Incorrect

```js
import { forwardRef } from "react";

export const Card = forwardRef(function Card(props, ref) { ... });
```

### ✅ Correct

```js
export function Card({ title, cardRef }) {
  return <div ref={cardRef}>{title}</div>;
}
```

## Edge Cases and False Positives

- The allowlist option exists for real interoperability boundaries. Use it for contained exceptions instead of quietly keeping `forwardRef` as the default pattern.
- If a component only forwards a ref because of historical wrapper structure, flattening the component boundary is usually a better fix than carrying the wrapper forward.

## Refactor Direction

Pass refs through newer component patterns or redesign the component boundary so `forwardRef` is not the default escape hatch.

## When To Disable

Disable when interoperability with a library or an existing imperative API still requires `forwardRef` in that specific boundary.
