# Changelog

## 2026-04-29

- Expanded `meridian-local/no-jsx-in-variables` so it now reports direct JSX lookup tables stored in object and array literals, while explicitly excluding config/data objects that only carry nested JSX fields such as icons.
- Documented the narrowed `no-jsx-in-variables` contract in the per-rule reference and package README with examples for direct JSX payload maps versus allowed config objects.

## 2026-04-25

- Removed `meridian-local/no-render-prop-naming` after review showed it was no longer worth carrying as separate package surface beside the broader forbidden-name policy.
- Removed `meridian-local/no-boolean-prop-proliferation` after review showed it was not a rule Meridian still wanted to keep as part of the public package contract.
- Added a standalone-ready consumer config surface under `configs/`, including `recommended`, `strict`, `pilot`, `all`, and taxonomy group entrypoints.
- Added `rules/index.js` as the consistent raw rule-module export surface and removed the one-off standalone export shape from the package contract.
- Removed redundant `configs/*.js` and `rules/index.js` package export aliases so the published subpath contract now has one canonical consumer shape.
- Tightened the package publish contract with explicit metadata, curated `files` patterns, and restricted publication defaults.
- Fixed the `meridian-local` plugin inventory so `react-component-filename-pascal-case` is exported from the canonical plugin surface instead of only by standalone module import.
- Hardened collection fallback receiver matching to use structural expression identity rather than raw source text.
- Reduced callback-complexity overcounting by stopping nested helper internals from inflating the outer callback signal.
- Added dedicated rule test files for previously smoke-only rules and added config-surface contract tests.
- Added a packed-artifact consumer smoke so the published `@meridian/eslint-rules` entrypoints are validated through an installed tarball instead of only through local source imports.
- Single-sourced grouped config taxonomy metadata inside `configs/shared.js` instead of maintaining separate manual rule arrays for each group export.
- Expanded `no-state-sync-useeffect` default hook coverage to include `useLayoutEffect`, and documented the exact-match behavior of `allowNames` for `no-forbidden-declaration-names`.
- Added maintainer guidance for fast test-failure isolation and a standalone extraction checklist for future repo/package separation.
- Rewrote the consumer-facing README and operator guidance around external package usage, grouped configs, support expectations, and the intentionally narrow `no-state-sync-useeffect` contract.

## 2026-04-23

- Added `meridian-local/no-collection-methods-on-spread-arrays` to flag pure spread-built array literals that immediately feed inline collection-method pipelines.
- Added `meridian-local/no-long-collection-method-chains` to warn when inline collection pipelines reach three tracked steps by default.
- Added `meridian-local/no-nested-try` to flag nested `try` blocks in the same execution frame, with configurable ancestor tracking for `try`, `catch`, and `finally`.
- Expanded the package README with rule-overlap comparisons, consumer config examples, workspace adoption status, exception-governance linkage, and changelog expectations.
- Expanded the operator guide with overlap guidance, example ESLint and Oxlint consumer patterns, shared exception-governance linkage, and a documented workspace adoption snapshot.
- Expanded the maintainer guide with pilot promotion criteria, overlap review expectations, workspace adoption context, and changelog-discipline guidance.

## 2026-04-21

- Added `meridian-local/no-nested-ternary-in-jsx` for nested ternaries in direct JSX render paths.
- Narrowed the rule contract so inline callback bodies under JSX are not reported by this rule.

## 2026-04-19

- Created `@meridian/eslint-rules` as the canonical home for Meridian-owned ESLint and Oxlint rule implementation.
- Moved rule modules, shared helpers, Oxlint adapter files, and rule tests out of `@meridian/config`.
- Added stable `recommended`, `strict`, and `pilot` rule profiles.
- Retired the temporary `@meridian/config` rule-entry compatibility façade after confirming there were no in-repo consumers.
