# no-inline-collection-fallbacks

Disallow standalone collection-method calls directly guarded by a fallback (`??` / `||`) when a single collection transformation is inlined.

## Why This Rule Exists

`rows.map(...) ?? []` is short, but it hides both the transformation and the fallback decision in one expression. That makes the fallback look cheaper and safer than it usually is.

## What It Reports

It targets standalone collection method calls that are immediately guarded by `??` or `||`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-inline-collection-fallbacks`
- Category: Collection readability
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-inline-collection-fallbacks.js](no-inline-collection-fallbacks.js)
- Tests:
  - [tests/rules/no-inline-collection-fallbacks.test.js](tests/rules/no-inline-collection-fallbacks.test.js)

## Rule Options

- `methods` (default: `find`, `map`, `filter`, `reduce`, `flatMap`, `some`, `every`)
- `operators` (default: `??`, `||`)

## Examples

### ❌ Incorrect

```js
const jobs = response.jobs?.map((job) => ({ ...job, downloadUrl: normalizeReportDownloadUrl(job.downloadUrl) })) ?? [];
```

### ✅ Correct

```js
const normalizedJobs =
  response.jobs?.map((job) => ({ ...job, downloadUrl: normalizeReportDownloadUrl(job.downloadUrl) })) ?? [];
return { ...response, jobs: normalizedJobs };
```

### ❌ Incorrect (multiple transformed fallbacks)

```js
const preferred = primaryRows.find((row) => row.isPrimary) ?? fallbackRows.filter((row) => row.isFallback) ?? [];
```

## Refactor Direction

Compute the transformed result first, then apply fallback behavior separately so each concern is visible and easy to change.

## When To Disable

Disable when the fallback is the dominant intent, the transform is minimal, and splitting the expression would only add ceremony.
