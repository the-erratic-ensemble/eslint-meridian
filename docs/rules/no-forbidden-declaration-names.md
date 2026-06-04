# no-forbidden-declaration-names

Prevent declaration/member/parameter names from matching forbidden naming fragments.

## Why This Rule Exists

Certain names are misleading enough that they create long-term confusion across declarations, props, and parameters. This rule lets the codebase ban those fragments explicitly instead of rediscovering the same naming drift in review.

## What It Reports

It checks declarations and member-like names against configured forbidden fragments or patterns.

## Meridian Profile Status

- Rule ID: `meridian-local/no-forbidden-declaration-names`
- Category: Naming and public API design
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-forbidden-declaration-names.js](no-forbidden-declaration-names.js)
- Tests:
  - [tests/rules/eslint-local-inline-rules.test.js](tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `allowNames` (default: `[]`) — exact identifier names to exempt from the rule. These entries are exact-match and case-sensitive; they do not inherit `caseSensitive: false` from the forbidden pattern matchers.
- `patterns` (required): array of objects with one matcher each:
  - `startsWith`
  - `contains`
  - `endsWith`
  - `caseSensitive` (default `true`)

## Examples

### ❌ Incorrect

```js
const user = "ok";
const reportRenderer = () => renderSomething();
```

### ✅ Correct

```js
const user = "ok";
const report = () => renderSomething();
```

## Edge Cases and False Positives

- Pattern changes have broad effect because the rule checks declarations, members, parameters, and some TypeScript-specific surfaces. Treat new patterns as governance changes, not casual cleanup.
- When a name comes from a third-party or backend contract, prefer a narrow allowlist entry or a local rename wrapper over weakening the shared pattern set.
- For framework contract keys that must remain spelled a certain way, prefer an exact `allowNames` entry in the consumer lint config over bracket-notation workarounds in product code.
- If both `RenderMode` and `renderMode` need to remain allowed, add both names explicitly. `allowNames` does not expand across casing variants.

## Refactor Direction

Rename the symbol to reflect what it actually represents, or narrow the configured forbidden list if the current ban is overreaching.

## When To Disable

Disable when the name is an unavoidable compatibility contract from an external API or framework surface that cannot be renamed locally.

Example: `react-hook-form` expects the option key `resolver`. If a consumer app needs that key in product code, allowlist the exact name locally instead of rewriting the object shape to avoid the rule.
