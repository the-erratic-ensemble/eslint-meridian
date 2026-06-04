# eslint-meridian

Standalone repository for the Meridian ESLint and Oxlint rules that enforce React API contracts, inline-complexity limits, collection readability, and UI/domain boundary expectations.

This package is intended to be consumed through its exported entrypoints. The package name is `eslint-meridian` and the standalone repository is published from `the-erratic-ensemble/eslint-meridian`.

## Installation

Required:

```bash
pnpm add -D eslint-meridian eslint @typescript-eslint/parser
```

Optional:

```bash
pnpm add -D oxlint
```

## Support Matrix

| Surface          | Requirement                                                |
| ---------------- | ---------------------------------------------------------- |
| Node             | `>=20.0.0`                                                 |
| ESLint           | `^10.0.0`                                                  |
| Config style     | Flat config only                                           |
| TypeScript / TSX | Provide `@typescript-eslint/parser` in the consumer config |
| Package manager  | `pnpm >=10.0.0` for Meridian-maintained workflows          |
| Oxlint           | Optional; use the exported JSON profile and plugin wrapper |

## Current Status

- The package is published publicly on npm as `eslint-meridian`.
- The repository ships from GitHub with Release Please-driven versioning on `main`.
- Meridian can still consume it directly through a local path dependency during local development.

## License

This repository is released under the [MIT License](LICENSE).

## Development and Release

For the maintainer workflow, including validation, versioning, and manual publish fallback, use [DEVELOPMENT.md](DEVELOPMENT.md).

## Public Contract

Prefer these exports over deep imports:

| Export                                                    | Purpose                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| `eslint-meridian`                                  | Canonical `meridian-local` ESLint plugin                    |
| `eslint-meridian/profile.js`                       | Raw additive `recommended`, `strict`, and `pilot` rule maps |
| `eslint-meridian/configs`                          | Named flat-config fragments and grouped rule maps           |
| `eslint-meridian/configs/recommended`              | Ready-to-use `recommended` flat-config fragment             |
| `eslint-meridian/configs/strict`                   | Ready-to-use `strict` flat-config fragment                  |
| `eslint-meridian/configs/pilot`                    | Ready-to-use `pilot` flat-config fragment                   |
| `eslint-meridian/configs/all`                      | Full exported rule inventory with default `warn` fallbacks  |
| `eslint-meridian/configs/react-contract`           | React/component contract grouping                           |
| `eslint-meridian/configs/callback-complexity`      | Inline callback complexity grouping                         |
| `eslint-meridian/configs/control-flow`             | Control-flow readability grouping                           |
| `eslint-meridian/configs/collection-readability`   | Collection readability grouping                             |
| `eslint-meridian/configs/naming-boundaries`        | Naming and boundary grouping                                |
| `eslint-meridian/rules`                            | Consistent named exports for raw rule modules               |
| `eslint-meridian/oxlint/meridian-local-plugin.js`  | Oxlint JS plugin wrapper                                    |
| `eslint-meridian/oxlint/meridian-local-rules.json` | Canonical Oxlint `recommended` profile                      |

## Profiles

The package keeps three additive profiles:

- `recommended`: stable baseline intended for broad adoption
- `strict`: `recommended` plus stronger boundary/readability rules that remain off by default
- `pilot`: `strict` plus the next deliberate rollout candidate

If you want one taxonomy only, use the grouped configs instead of reconstructing rule lists from docs prose.

## ESLint Usage

### Recommended profile

```javascript
import tseslintParser from "@typescript-eslint/parser";
import { meridianLocalRecommendedConfig } from "eslint-meridian/configs";

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    ...meridianLocalRecommendedConfig
  }
];
```

### Taxonomy-only rollout

```javascript
import tseslintParser from "@typescript-eslint/parser";
import { meridianLocalCollectionReadabilityConfig } from "eslint-meridian/configs";

export default [
  {
    files: ["src/features/search/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslintParser
    },
    ...meridianLocalCollectionReadabilityConfig
  }
];
```

### Custom rule selection with the stable profile helper

```javascript
import tseslintParser from "@typescript-eslint/parser";
import meridianLocalRules from "eslint-meridian";
import { getMeridianLocalRuleProfile } from "eslint-meridian/profile.js";

const strictRules = getMeridianLocalRuleProfile("strict");

export default [
  {
    files: ["src/routes/**/*.tsx"],
    languageOptions: {
      parser: tseslintParser
    },
    plugins: {
      "meridian-local": meridianLocalRules
    },
    rules: {
      ...strictRules,
      "meridian-local/no-mixed-ui-and-domain-logic-in-component": "off"
    }
  }
];
```

## Oxlint Usage

Use the package profile directly:

```json
{
  "plugins": ["./node_modules/eslint-meridian/oxlint/meridian-local-plugin.js"],
  "extends": ["./node_modules/eslint-meridian/oxlint/meridian-local-rules.json"]
}
```

If your tooling resolves package exports directly for JSON and plugin paths, use the package specifier instead of `node_modules` paths. The package contract is the exported file, not a repo-relative Meridian path.

## Rule Groupings

`eslint-meridian/configs` exports these stable groupings:

- `meridianLocalReactContractConfig`
- `meridianLocalCallbackComplexityConfig`
- `meridianLocalControlFlowConfig`
- `meridianLocalCollectionReadabilityConfig`
- `meridianLocalNamingBoundaryConfig`
- `meridianLocalRuleGroups`
- `createRuleSelection(...)`
- `createFlatConfig(...)`

These groupings are meant for selective rollout, not for bypassing the `recommended` / `strict` / `pilot` contract.

## Rule Quality Notes

The strongest current rules are the ones with narrow contracts and direct refactor guidance, such as:

- `meridian-local/no-nested-try`
- `meridian-local/no-deep-control-flow-nesting`
- `meridian-local/no-inline-spread-collection-pipelines`
- `meridian-local/no-long-inline-object-methods`
- `meridian-local/react-component-filename-pascal-case`

The most heuristic-heavy rules are:

- `meridian-local/no-state-sync-useeffect`
- `meridian-local/no-inline-collection-fallbacks`
- `meridian-local/no-repeated-collection-method-fallbacks`
- `meridian-local/no-complex-array-callbacks`
- `meridian-local/no-complex-hook-callbacks`
- `meridian-local/no-jsx-in-variables`
- `meridian-local/no-staged-conditional-class-tokens`

Those rules are still part of the package contract, but consumers should expect narrower shape matching and should read the per-rule docs before suppressing or escalating them.

## `no-jsx-in-variables` Contract

`meridian-local/no-jsx-in-variables` is intentionally narrow today.

It reports:

- direct JSX assignments such as `const panel = <Panel />`
- conditional or logical expressions whose assigned value is JSX
- object literals whose direct property values are JSX render payloads
- array literals whose direct elements are JSX render payloads

It does not report:

- config/data objects with nested JSX fields such as `icon: <MapPin />`
- arrays of config/data objects that include nested JSX fields
- helper/component references such as `const tabPanels = { overview: OverviewPanel }`

Use this rule for stored render payloads, not as a blanket ban on JSX anywhere inside object or array literals.

Preferred refactor shape:

- move variant data into typed config objects
- render that config through a standalone component
- use component references instead of JSX instances when the variants need real structural differences

Do not “fix” the warning by building a config object that is mostly hidden JSX under different property names.

## `no-state-sync-useeffect` Contract

`meridian-local/no-state-sync-useeffect` is intentionally narrow today.

It reports the direct state-mirroring shape where:

- the effect or layout-effect callback is a block
- the block contains exactly one statement
- that statement is a direct setter call
- dependency matching is based on root identifier names

It does not try to catch every state-sync pattern. Guarded effects, transformed writes, alias setters, and broader derivation logic should be treated as separate behavior and validated against the current tests before changing rollout expectations.

## Semver Expectations

This package treats these as breaking changes:

- removing or renaming an exported rule ID
- removing or renaming an exported config entrypoint
- promoting a rule into `recommended` when that materially increases default findings
- changing a documented rule from narrow to broad matching in a way that predictably creates new reports

These may ship in a non-breaking release when the rule intent stays the same:

- clearer diagnostics
- documentation improvements
- tighter false-positive handling
- additional grouped config exports
- new rules added only to `pilot` or opt-in grouped surfaces

## Documentation

- Consumer rollout guidance: [`docs/2026-04-23-operator-guide.md`](docs/2026-04-23-operator-guide.md)
- Maintainer workflow: [`docs/2026-04-23-maintainer-guide.md`](docs/2026-04-23-maintainer-guide.md)
- Development and release workflow: [`DEVELOPMENT.md`](DEVELOPMENT.md)
- Standalone extraction checklist: [`docs/2026-04-25-standalone-extraction-checklist.md`](docs/2026-04-25-standalone-extraction-checklist.md)
- Per-rule reference: [`docs/rules/index.md`](docs/rules/index.md)
- Package history: [`CHANGELOG.md`](CHANGELOG.md)
