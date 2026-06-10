# no-local-jsx-helper-calls

Disallow invoking local JSX-returning helpers as plain function calls inside JSX render paths.

## Why This Rule Exists

Calling a local helper that returns JSX hides component structure behind an ordinary function call. That makes render paths harder to scan and nudges component-shaped UI back into pseudo-render helpers.

When a helper is producing JSX for render output, it should usually be a component or the branch should stay inline near the return path.

## What It Reports

It warns when a locally defined function or arrow helper has an explicit JSX-like return annotation such as `(): JSX.Element`, `(): JSX.Element | null`, or `(): ReactElement`, and is then invoked as a plain function call inside JSX.

It does not warn on ordinary formatter or utility calls that return strings, numbers, booleans, or other non-JSX values.

## Meridian Profile Status

- Rule ID: `meridian-local/no-local-jsx-helper-calls`
- Category: JSX and styling hygiene
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-local-jsx-helper-calls.js](../../rules/no-local-jsx-helper-calls.js)
- Validation workflow: [DEVELOPMENT.md](../../DEVELOPMENT.md)

## Rule Options

This rule has no options.

## Examples

### ❌ Incorrect

```tsx
function AreaDetails() {
  function historyContent() {
    return <section>History</section>;
  }

  return <div>{historyContent()}</div>;
}
```

```tsx
function RankedBarListChart({ item }: { item: RankedBarDatum }) {
  return (
    <div>
      {optionalTextBlock(
        item.secondaryLabel,
        "text-sm text-[var(--color-text)]/62",
      )}
    </div>
  );
}
```

### ✅ Correct

```tsx
function HistoryContent(): JSX.Element {
  return <section>History</section>;
}

function AreaDetails() {
  return (
    <div>
      <HistoryContent />
    </div>
  );
}
```

```tsx
function OptionalTextBlock({
  text,
  className,
}: {
  text?: string;
  className: string;
}): JSX.Element | null {
  if (!text) {
    return null;
  }

  return <div className={className}>{text}</div>;
}

function RankedBarListChart({ item }: { item: RankedBarDatum }) {
  return (
    <div>
      <OptionalTextBlock
        text={item.secondaryLabel}
        className="text-sm text-[var(--color-text)]/62"
      />
    </div>
  );
}
```

## Refactor Direction

Prefer one of these shapes:

- extract a real component and render it as `<Component />`
- move the JSX branch back inline when the helper is small

This rule is intentionally narrow in one dimension only: it requires an explicit JSX-like return type. Within that boundary, both zero-argument and argument-taking JSX helpers are treated as render-helper calls and should be rendered as JSX elements or inlined.

## When To Disable

Disable only when the local helper call is a deliberate contract boundary and converting it into a component or inline branch would make the render path materially harder to understand.
