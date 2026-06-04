# react-component-filename-pascal-case

Require PascalCase filenames for `.jsx` / `.tsx` files that define top-level React components.

## Why This Rule Exists

Component file names are part of the navigation surface of a React codebase. PascalCase filenames make component files easier to distinguish from hooks, helpers, and route modules.

## What It Reports

It checks `.jsx` and `.tsx` files that define top-level React components and requires the filename itself to be PascalCase.

## Meridian Profile Status

- Rule ID: `meridian-local/react-component-filename-pascal-case`
- Category: JSX and styling hygiene
- `recommended`: not included
- `strict`: not included
- `pilot`: not included

## Source of Truth

- Implementation: [react-component-filename-pascal-case.js](../../rules/react-component-filename-pascal-case.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `ignore` (default: `["index"]`) — filename bases that are excluded.

## Examples

### ❌ Incorrect

```jsx
// file: user-card.tsx
export const UserCard = () => <div />;
```

### ✅ Correct

```jsx
// file: UserCard.tsx
export const UserCard = () => <div />;
```

## Refactor Direction

Rename the file to match the exported component or extract non-component helpers into lower-case utility files.

## When To Disable

Disable when the file is constrained by framework routing conventions or a generated filename contract that should not be changed.
