# Development

## First-Time Setup

1. Install dependencies:

```bash
pnpm install
```

2. Authenticate npm when you need to publish:

```bash
npm login --registry=https://registry.npmjs.org/
```

Auth stays outside the repo. The package is unscoped and publishes as `eslint-meridian`.

## Normal Edit Loop

- Change rule code, docs, configs, or tests.
- Run the release validation gate before pushing:

```bash
pnpm release:validate
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

You can also run the workflow manually from GitHub Actions with `workflow_dispatch` if you need to re-run the release job after fixing an external issue such as npm auth.

The workflow uses these repository secrets:

- `RELEASE_PLEASE_TOKEN`: GitHub PAT used by Release Please so release PRs and releases can trigger downstream workflows.
- `NPM_TOKEN`: npm token with publish rights for `eslint-meridian` and 2FA bypass enabled.

## Publish Mode

This repository is configured to publish `eslint-meridian` as a public npm package.

Package metadata that controls this lives in `package.json`:

- `publishConfig.access = "public"`
- `publishConfig.registry = "https://registry.npmjs.org/"`

## Manual Publish Fallback

If you need to publish a one-off version manually instead of waiting for Release Please:

```bash
pnpm release:validate
npm publish
```

Make sure you have already authenticated with `npm login`, or provide a temporary user config that contains a bypass-2FA publish token.

## Notes

- Keep `CHANGELOG.md` under Release Please control.
- Keep `.release-please-manifest.json` aligned with the most recently published version.
- Meridian can continue using the local repo for development even after public npm publishing is enabled.
- `prepublishOnly` runs `pnpm release:validate`, so manual `npm publish` will fail fast if docs or rule tests are out of sync.
