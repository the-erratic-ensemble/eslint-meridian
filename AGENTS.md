---
title: "eslint-meridian — Agent Guide"
type: "reference"
description: "Scope boundaries, export contracts, and migration traps for the Meridian-owned custom ESLint and Oxlint rule package."
status: "active"
date created: "2026-04-19"
date modified: "2026-04-25"
tags: [eslint, oxlint, lint, rules, packages]
component: [packages, config]
audience: "developer"
---

# eslint-meridian — Agent Guide

## Scope

This package owns Meridian-specific lint rule implementation, including:

- `rules/eslint-local-rules.js` — canonical `meridian-local` plugin export
- `rules/eslint-local-rules-shared.js` — shared AST helpers for rule implementations
- `configs/` — consumer-facing flat-config fragments and taxonomy groupings
- Meridian-specific rule modules (`no-*.js`, `react19-no-forwardref.js`, `react-component-filename-pascal-case.js`)
- `rules/profile.js` — stable `recommended`, `strict`, and `pilot` rule profiles
- `rules/index.js` — consistent raw rule-module export surface
- `oxlint/meridian-local-plugin.js` and `oxlint/meridian-local-rules.json`
- `tests/rules/` parity and rule-level tests

## What Belongs In `@meridian/config` Instead

| Keep out of this package                           | Put it there instead                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Shared app ESLint preset wiring                    | `packages/config/react.config.js`, `packages/config/hardcore-react.config.js`, `packages/config/eslint.config.js` |
| Shared Playwright and Vitest config                | `packages/config/playwright.config.js`, `packages/config/vitest.base.js`                                          |
| App-specific lint exceptions and import boundaries | App `eslint.config.*` files and exception registry tooling                                                        |

## Import Patterns

```javascript
import meridianLocalRules from "eslint-meridian";
import { meridianLocalRecommendedRuleProfile } from "eslint-meridian/profile.js";
```

```javascript
import { meridianLocalRecommendedConfig } from "eslint-meridian/configs";
```

```javascript
import meridianLocalOxlintPlugin from "eslint-meridian/oxlint/meridian-local-plugin.js";
```

## Common Agent Traps

- Do not reintroduce Meridian-owned rule implementation into `packages/config`; keep `@meridian/config` as a thin preset layer.
- Do not edit both the canonical Oxlint JSON and the config compatibility copy without updating the parity test.
- Do not add one-off standalone export paths when `rules/index.js` or `configs/*` should carry the contract.
- Do not change `meridian-local/*` rule IDs casually; suppressions and docs treat those names as contract.
