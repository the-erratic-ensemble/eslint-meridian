---
title: "Meridian Custom Lint Rules Maintainer Guide"
type: "guide"
description: "Maintainer-facing guidance for adding new Meridian custom lint rules, wiring them into profiles, and keeping tests and docs in sync."
status: "active"
date created: "2026-04-23"
date modified: "2026-05-31"
tags: [eslint, lint, rules, maintainer-guide]
component: [packages, tooling]
related:
  - README.md
  - docs/2026-04-23-operator-guide.md
  - docs/rules/index.md
---

# Meridian Custom Lint Rules Maintainer Guide

Use this guide when you are changing the rule inventory owned by `eslint-meridian`.

This package owns implementation and profile artifacts. Shared preset wiring belongs in `@meridian/config`, not here.

## Package Contracts

Keep these contracts stable unless you are executing an intentional breaking change review:

- exported rule IDs stay under the `meridian-local/*` namespace
- `rules/eslint-local-rules.js` is the canonical ESLint plugin export
- `configs/index.js` is the canonical grouped config export surface
- `oxlint/meridian-local-rules.json` is the canonical `recommended` profile artifact
- `rules/profile.js` layers `strict` and `pilot` additively on top of that canonical JSON
- `rules/index.js` is the only supported raw rule-module export surface
- profile and parity tests in `tests/rules/` must stay aligned with the exported inventory

## Rule Addition Checklist

Follow this order when adding a new rule.

1. Decide whether the rule belongs in this package.

Add it here only if it encodes Meridian-specific readability, naming, or boundary expectations. If it is generic ESLint preset wiring or app-level policy, keep it in `@meridian/config` or the consuming app.

2. Pick the stable rule ID.

- prefer a descriptive `no-*` or `prefer-*` name
- optimize for the future suppression comment, not just the filename
- avoid renaming shipped IDs casually; the rule ID is the operator contract

3. Add the implementation module in `rules/`.

Create `rules/<rule-file>.js` and keep the implementation self-contained unless shared AST helpers already exist in `rules/eslint-local-rules-shared.js`.

4. Export the rule from [`rules/eslint-local-rules.js`](rules/eslint-local-rules.js).

Add both:

- the module import
- the `LOCAL_RULES` entry keyed by the shipped rule ID

The key in `LOCAL_RULES` is what consumers suppress against. That contract matters more than the filename.

If the rule is intentionally part of the raw rule-module surface, also export it from [`rules/index.js`](rules/index.js). Do not create one-off standalone rule exports in `package.json`.

5. Decide profile placement.

- add the rule to `oxlint/meridian-local-rules.json` if it belongs in `recommended`
- add it to `STRICT_ADDITIONS` in [`rules/profile.js`](rules/profile.js) if it should remain off in `recommended` but on in `strict`
- add it to `PILOT_OVERRIDES` only for deliberate trial rollout

Do not create a fourth profile casually. Existing config consumers expect `recommended`, `strict`, and `pilot`.

6. Add tests.

At minimum:

- add a dedicated `tests/rules/<rule>.test.js` file for the rule behavior
- extend `tests/rules/eslint-local-inline-rules.test.js` if the rule belongs in the package-wide smoke surface
- update `tests/rules/meridian-local-profiles.test.js` when profile membership changes
- update `tests/rules/config-entrypoints.test.js` when grouped config behavior or export inventory changes

7. Add rule docs.

Create `docs/rules/<rule>.md` and link it from `docs/rules/index.md`.

8. Update package-facing navigation docs.

If the new rule changes how operators choose profiles or interpret the taxonomy, update:

- [`README.md`](README.md)
- [`2026-04-23-operator-guide.md`](docs/2026-04-23-operator-guide.md)
- [`CHANGELOG.md`](CHANGELOG.md) when the operator contract, rollout state, or profile guidance changed

## Contribution Guidance

### Choose the smallest enforceable behavior

Good rules catch one recognizable shape and point toward one refactor direction. Avoid omnibus rules that punish many unrelated patterns with one message.

### Prefer readability and boundary rules over taste rules

The strongest additions in this package usually do one of these:

- expose a risky inline expression shape
- force domain shaping out of UI
- stop naming patterns Meridian explicitly rejects

Rules that only encode style preference without a readability or maintenance benefit should not land here.

### Make messages actionable

A maintainer should be able to read the message and know the next move:

- extract a helper
- stage a local
- replace a boolean cluster with a variant
- move mapping logic out of the component

If the fix direction is unclear, the rule is probably too broad.

### Keep profile churn deliberate

- `recommended` is for rules that are already ready for wide use
- `strict` is for stronger but still credible defaults
- `pilot` is for rollout learning, not a parking lot for unfinished ideas

When promoting a pilot rule, update the profile tests in the same change.

## Pilot Promotion Criteria

Do not promote a rule from `pilot` just because the implementation exists.

Promote only when all of these are true:

- the rule message and docs point toward one clear refactor direction
- the rule has survived at least one bounded consumer trial without a pattern of noisy false positives
- the package tests and profile parity tests cover the intended boundary cases
- operators no longer need `pilot` framing to understand when suppression is justified
- the adoption decision is reflected in package docs and changelog history

If those conditions are not met, keep the rule in `pilot` or remove it. Do not let `pilot` become a permanent holding area.

## Rule Overlap Review

Before adding a new rule, check whether an existing rule already covers the same operator decision.

Look especially for overlap between:

- complexity versus length rules for inline callbacks and object methods
- collection-branch rules versus collection-callback rules
- JSX-specific readability rules versus broader third-party rules already disabled to avoid duplicate reporting

If two rules would suggest the same refactor to the same code shape, narrow one of them before shipping both.

## Exception Governance Linkage

This package defines rule IDs and profiles, but app-level policy exceptions are governed elsewhere.

- Shared config exceptions should use stable `ESLINT-EX-*` comments in the consumer config.
- Registry ownership and validator expectations live in `docs/reference/2026-03/2026-03-25-eslint-governance-tooling-reference.md`.
- Do not add free-form "temporary" comments in package docs as a substitute for governed exceptions in consuming configs.

When writing maintainer docs or rollout notes, link to the governance reference instead of duplicating the registry schema here.

## Workspace Adoption Awareness

Current documented adoption matters when deciding whether a new rule is ready for `recommended`.

- `recommended` is already consumed by shared React config in `packages/config`.
- The canonical Oxlint profile is already extended by `apps/web`, `apps/admin`, and `apps/marketing`.
- `pilot` is published, but no long-lived workspace is documented here as a standing `pilot` adopter.

That means promotion decisions should assume real downstream blast radius, even when the initial rule work happened in one package.

## Common Failure Modes

- Implementing the rule but forgetting to export it from `rules/eslint-local-rules.js`
- Editing the JS profile overlays without updating the parity test expectations
- Adding a grouped config or export alias without adding a config-surface test
- Adding a rule to `recommended` in JS instead of the canonical Oxlint JSON
- Shipping the rule without `docs/rules/<rule>.md`
- Treating implementation filenames as the external contract when the real contract is the exported rule ID
- Documenting a standalone rule import path that is not actually exported by the plugin
- Reintroducing package-owned rule logic into `@meridian/config`
- Leaving rollout state undocumented after changing `recommended`, `strict`, or `pilot`
- Moving a consumer-specific exception into package profiles instead of keeping it in consumer config governance

## Suggested Authoring Workflow

1. Sketch the forbidden code shape and the preferred refactor.
2. Write the rule with the smallest viable option surface.
3. Add a focused dedicated test file with both valid and invalid examples.
4. Wire the rule into the correct profile layer.
5. Update the profile parity test if membership changed.
6. Write the rule doc in `docs/rules/`.
7. Re-check the operator guide if the taxonomy or rollout guidance changed.
8. Add a dated `CHANGELOG.md` entry if the shipped contract, adoption guidance, or maintainer workflow changed.
9. Regenerate `docs/rules/index.md` with `pnpm --filter eslint-meridian generate:docs`.

## Changelog Discipline

`CHANGELOG.md` is the maintainer-facing history for package contract changes, not a dump of every file edit.

Add an entry when you change:

- exported rule IDs
- profile membership or default severities
- documented workspace adoption status
- pilot promotion or demotion decisions
- maintainer/operator guidance that changes how consumers should roll out or suppress rules

Keep entries specific enough that another maintainer can answer "what changed for consumers?" without diffing the whole package.

## Validation Commands

Run the package-local checks before handing off the change:

```bash
pnpm --filter eslint-meridian generate:docs
pnpm --filter eslint-meridian lint
pnpm --filter eslint-meridian test:rules
pnpm --filter eslint-meridian check:docs
pnpm --filter eslint-meridian format:check
```

If profile membership changed, confirm the expectations in [`tests/rules/meridian-local-profiles.test.js`](tests/rules/meridian-local-profiles.test.js) still match the shipped profile layers.

### Fast Failure Isolation

When `node --test tests/rules/**/*.test.js` fails noisily, narrow it before re-running the whole package suite.

Useful pattern:

```bash
pnpm test:rules 2>&1 | rg -n "not ok|^# fail|failureType|AssertionError"
```

Use the failing test name from that output to jump straight to the dedicated file before running a full package pass again.

## Standalone Release Checklist

Before broader distribution, explicitly close these package-level assumptions:

- replace monorepo `repository`, `homepage`, and `bugs` metadata with the new ownership location
- make a deliberate license decision instead of carrying `UNLICENSED` forward by inertia
- rerun packed-artifact consumer smoke outside this monorepo
- re-check documented Node, ESLint, parser, and Oxlint support ranges against the new release target
- confirm issue routing, changelog ownership, and release responsibility for the new home
