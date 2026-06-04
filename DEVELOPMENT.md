# Development

## First-Time Setup

1. Install dependencies:

```bash
pnpm install
```

2. Authenticate npm when you need to publish:

```bash
npm login --scope=@meridian --registry=https://registry.npmjs.org/
```

The repository `.npmrc` only pins the `@meridian` scope to npm. Auth stays outside the repo.

## Normal Edit Loop

- Change rule code, docs, configs, or tests.
- Run the narrow checks that matter:

```bash
pnpm check:docs
node --test tests/rules/meridian-local-profiles.test.js tests/rules/oxlint-meridian-local-plugin.test.js
```

- Commit with Conventional Commits. Release Please uses these prefixes for versioning:
  - `fix:` -> patch
  - `feat:` -> minor
  - `feat!:` or `fix!:` -> major

## Release Flow

`main` is the release branch.

When you push conventional commits to `main`, `.github/workflows/release-please.yml` does two jobs:

1. Opens or updates a Release Please PR with the next version and changelog changes.
2. After that release PR is merged, creates the GitHub release and publishes the package to npm.

The workflow uses these repository secrets:

- `RELEASE_PLEASE_TOKEN`: GitHub PAT used by Release Please so release PRs and releases can trigger downstream workflows.
- `NPM_TOKEN`: npm token with publish rights for `@meridian/eslint-rules`.

## Initial Private Publish

This repository is configured to publish `@meridian/eslint-rules` as a restricted npm package.

Package metadata that controls this lives in `package.json`:

- `publishConfig.access = "restricted"`
- `publishConfig.registry = "https://registry.npmjs.org/"`

## Manual Publish Fallback

If you need to publish a one-off version manually:

```bash
npm publish
```

Make sure you have already authenticated with `npm login`, or provide a temporary user config that contains the auth token.

## Notes

- Keep `CHANGELOG.md` under Release Please control.
- Keep `.release-please-manifest.json` aligned with the most recently published version.
- Meridian can continue using the local repo for development even after private npm publishing is enabled.
