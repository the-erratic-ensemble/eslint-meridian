---
title: "Meridian Custom Lint Rules Operator Guide"
type: "guide"
description: "Operator-facing guidance for choosing Meridian lint profiles, staging grouped rollouts, and deciding when suppression is justified."
status: "active"
date created: "2026-04-23"
date modified: "2026-06-04"
tags: [eslint, lint, rules, operator-guide]
component: [packages, tooling]
related:
  - README.md
  - docs/rules/index.md
---

# Meridian Custom Lint Rules Operator Guide

Use this guide when you are consuming `eslint-meridian` from an app or package and need to decide:

- which `meridian-local` profile to enable
- whether a warning should trigger a refactor or a suppression
- which grouped config or refactor shape matches the rule family you are rolling out

Per-rule details still live in [the rule reference](./rules/index.md). This guide explains how to operate the rules as a set.

## Consumer Baseline

Assume these requirements before enabling the package:

- ESLint flat config, not legacy `.eslintrc`
- Node `>=20`
- ESLint `^10`
- `@typescript-eslint/parser` for TypeScript or TSX surfaces
- package entrypoints, not repo-internal file paths

Prefer the exported config fragments under `eslint-meridian/configs` unless you have a good reason to wire the plugin manually.

## Rule Taxonomy

The package is easiest to reason about by intent instead of file name order.

### React and component contract rules

These rules keep component APIs and React usage aligned with Meridian conventions.

- `meridian-local/react19-no-forwardref`
- `meridian-local/react-component-filename-pascal-case`
- `meridian-local/no-inline-object-literals-in-jsx`
- `meridian-local/no-inline-conditional-styles`
- `meridian-local/prefer-classname-helper-module`
- `meridian-local/no-jsx-in-variables`
- `meridian-local/no-render-time-date-in-jsx`
- `meridian-local/no-staged-conditional-class-tokens`
- `meridian-local/no-excessive-component-props`
- `meridian-local/no-prop-bags`

### Callback and inline complexity rules

These rules push logic out of cramped inline expressions and callback bodies.

- `meridian-local/no-complex-inline-handlers`
- `meridian-local/no-complex-array-callbacks`
- `meridian-local/no-complex-hook-callbacks`
- `meridian-local/no-complex-jsx-collection-callback`
- `meridian-local/no-complex-inline-object-methods`
- `meridian-local/no-long-inline-object-methods`
- `meridian-local/no-nested-ternary-in-jsx`

### Control-flow and branch readability rules

These rules target imperative shapes that become risky to edit once nested or repeated.

- `meridian-local/no-ternary-in-branch-assignment`
- `meridian-local/no-let-mutation-in-if-chain`
- `meridian-local/no-deep-control-flow-nesting`
- `meridian-local/no-nested-try`
- `meridian-local/no-long-if-else-chain`
- `meridian-local/no-deep-optional-chaining-conditions`

### Collection-shaping rules

These rules are narrow readability guards around inline collection work.

- `meridian-local/no-collection-methods-in-ternaries`
- `meridian-local/no-collection-methods-on-spread-arrays`
- `meridian-local/no-collection-constructor-pipelines`
- `meridian-local/no-inline-spread-collection-pipelines`
- `meridian-local/no-long-collection-method-chains`
- `meridian-local/no-conditional-expressions-in-collection-callbacks`
- `meridian-local/no-flatmap-present-items`
- `meridian-local/no-conditional-collection-initializers`
- `meridian-local/no-inline-collection-fallbacks`
- `meridian-local/no-repeated-collection-method-fallbacks`
- `meridian-local/no-indexed-collection-pipeline-fallbacks`
- `meridian-local/no-set-map-from-flatmap`

### Naming and boundary rules

These rules enforce Meridian naming and boundary expectations.

- `meridian-local/no-forbidden-declaration-names`
- `meridian-local/no-mixed-ui-and-domain-logic-in-component`
- `meridian-local/no-state-sync-useeffect`

## Profile Matrix

`rules/profile.js` and the `configs/*` exports expose three stable profiles. They are additive on purpose.

| Profile       | Source of truth                                       | What it enables                                                                             | When to use it                                                   |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `recommended` | `oxlint/meridian-local-rules.json`                    | Current stable baseline                                                                     | Default for production adoption                                  |
| `strict`      | `recommended` plus JS additions in `rules/profile.js` | Adds `no-deep-optional-chaining-conditions`, `no-mixed-ui-and-domain-logic-in-component`, `no-excessive-component-props`, and `no-prop-bags` | Use when a surface already expects stricter boundary enforcement |
| `pilot`       | `strict` plus JS additions in `rules/profile.js`      | Adds `no-inline-object-literals-in-jsx`                                                     | Use only for bounded trial rollout                               |

## Profile Selection Guide

- Start with `recommended` for any new package or app rollout.
- Move to `strict` only after the team agrees that UI/domain boundary cleanup belongs in that surface right now.
- Use `pilot` for short-lived evaluation windows, not as a silent permanent default.
- If a profile blocks adoption, do not fork rule IDs or edit package internals from the consumer. Downgrade at the consumer config layer with an explicit reason.

## Grouped Config Surface

If a full profile rollout is too broad, use one of the grouped config fragments:

- `meridianLocalReactContractConfig`
- `meridianLocalCallbackComplexityConfig`
- `meridianLocalControlFlowConfig`
- `meridianLocalCollectionReadabilityConfig`
- `meridianLocalNamingBoundaryConfig`

These map directly to the taxonomy in this guide. They exist so consumers can stage coherent rule families without reconstructing lists from documentation.

## Overlap and Comparison Guide

Use the closest rule match before deciding a warning is redundant.

| If you hit this                          | Check this too                                       | How to decide                                                                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-complex-inline-object-methods`       | `no-long-inline-object-methods`                      | If the method is short but dense, complexity is the real problem. If it is long even with simple control flow, the length rule is the main signal.                                                   |
| `no-nested-try`                          | `no-deep-control-flow-nesting`                       | Use nested-try when the real problem is overlapping error boundaries. Use deep-control-flow-nesting when the issue is branch depth even without try/catch.                                           |
| `no-long-collection-method-chains`       | `no-inline-spread-collection-pipelines`              | Use long-collection-method-chains for general inline pipeline length. Use inline-spread-collection-pipelines when the extra readability cost comes from spread assembly.                             |
| `no-collection-methods-on-spread-arrays` | `no-inline-spread-collection-pipelines`              | Use collection-methods-on-spread-arrays for pure spread wrappers like `[...items].filter(...)`. Use inline-spread-collection-pipelines when regular elements and spread assembly are mixed together. |
| `no-inline-collection-fallbacks`         | `no-repeated-collection-method-fallbacks`            | Repeated receiver work across a fallback chain is a stronger signal than a single inline fallback. Stage the collection once and both warnings usually disappear.                                    |
| `no-collection-methods-in-ternaries`     | `no-conditional-expressions-in-collection-callbacks` | One flags branch-level collection work; the other flags callback-level branch compression.                                                                                                           |
| `no-inline-conditional-styles`           | `prefer-classname-helper-module`                     | Fix the inline conditional first. If style decisions still stay noisy after extraction, move the policy into a helper module.                                                                        |
| `no-nested-ternary-in-jsx`               | `unicorn/no-nested-ternary`                          | Treat Meridian's rule as the JSX contract. Avoid layering a broader nested-ternary rule on the same render path unless you explicitly want both.                                                     |

Do not suppress one rule just because a nearby rule also reports the same line. Refactor toward the clearer code shape and then re-run lint to see which signal remains.

## Consumer Config Patterns

Prefer config/profile imports at the consumer boundary instead of duplicating rule lists.

ESLint flat config:

```javascript
import tseslintParser from "@typescript-eslint/parser";
import { meridianLocalRecommendedConfig } from "eslint-meridian/configs";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslintParser,
    },
    ...meridianLocalRecommendedConfig,
  },
];
```

Targeted `pilot` evaluation on one surface:

```javascript
import tseslintParser from "@typescript-eslint/parser";
import { meridianLocalPilotConfig } from "eslint-meridian/configs";

export default [
  {
    files: ["src/features/search/**/*.tsx"],
    languageOptions: {
      parser: tseslintParser,
    },
    ...meridianLocalPilotConfig,
  },
];
```

Oxlint consumer:

```json
{
  "plugins": ["./node_modules/eslint-meridian/oxlint/meridian-local-plugin.js"],
  "extends": ["./node_modules/eslint-meridian/oxlint/meridian-local-rules.json"]
}
```

Keep consumer exceptions local. Do not edit `rules/profile.js` just to make one surface quieter.

## Suppression Policy

Default stance: refactor first, suppress last.

Use a suppression only when all of these are true:

- the rule is flagging an intentional local tradeoff, not a lazy inline shortcut
- the preferred refactor would make the code harder to follow, not easier
- the code shape is temporary, generated, or boxed in by an external API
- you can name the reason in one short comment without hand-waving

Prefer the narrowest escape hatch:

1. Refactor the expression, callback, or component boundary so the rule no longer applies.
2. If the rule is correct but the rollout is too noisy for one surface, override the rule in that surface's lint config with a dated reason.
3. If one line or block is the justified exception, use a local disable comment with the exact `meridian-local/<rule-id>` value and a reason tied to the code.

When a shared lint config override is needed, document it in the consuming repository's lint-governance process. Use a stable `ESLINT-EX-*`-style ID in the consumer config comment rather than a free-form note.

Do not suppress when:

- the rule is exposing mixed concerns you already planned to separate
- the warning disappears after extracting a named helper, prepared view model, or staged local
- the code can be made compliant by expanding a one-liner into a small, direct block

## Common Refactor Patterns

### Stage collection work into named locals

Use this when collection rules complain about chained ternaries, fallbacks, or constructor pipelines.

Prefer:

- `const visibleItems = items.filter(...)`
- `const selectedItem = visibleItems.at(0) ?? null`
- `const itemIds = visibleItems.map(...)`

Avoid compressing all of that into one branch or constructor call.

### Extract callback bodies into named helpers

Use this when inline handler, hook, JSX callback, or object-method rules report dense logic.

Prefer:

- a top-level helper function
- a small component-local function
- a prepared mapper function passed into `map`, `filter`, or JSX

Avoid replacing one unreadable inline callback with another anonymous helper nested two lines away.

### Use config-driven components for data-shaped UI variants

Use this when `no-jsx-in-variables` reports a lookup table of direct JSX payloads, but the variants mostly differ by copy, state labels, tone, or a few primitive flags.

Prefer:

- a typed config record with strings, booleans, enums, and other primitive display data
- one standalone component that renders from that config
- component references in config only when the referenced component is itself a clear boundary

Avoid:

- config records whose values are large JSX trees
- config objects that mostly exist to transport `className` blobs and one-off layout switches
- replacing a JSX payload map with a disguised render-helper map

If the config starts to look like a templating language, stop and extract real components instead.

### Derive state instead of syncing it

Use this when `no-state-sync-useeffect` fires.

Prefer:

- derive from props or query data during render
- reset by changing a `key`
- move the write to the event that actually changes the source value

Avoid `useEffect(() => setState(...), [source])` when the state only mirrors another value.

This rule is intentionally narrow today. Treat it as a direct mirror-state guard, not as a general effect-correctness rule.

### Move domain shaping out of components

Use this when `no-mixed-ui-and-domain-logic-in-component` or deeper complexity rules fire.

Prefer:

- backend-prepared view models
- feature service or mapper boundaries
- selectors or dedicated view-model helpers outside the route component

Avoid pricing, taxonomy, access, and domain derivation inline in JSX trees.

### Move className logic into a helper module

Use this when `prefer-classname-helper-module` or `no-inline-conditional-styles` fires.

Prefer a named helper module when the same className policy repeats across files or branches.
