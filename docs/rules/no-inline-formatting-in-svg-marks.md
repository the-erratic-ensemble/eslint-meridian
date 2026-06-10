# no-inline-formatting-in-svg-marks

Avoid formatting display values inline inside SVG mark markup.

## Why This Rule Exists

Inline formatting inside SVG mark JSX mixes display-label preparation with geometry and markup. In chart code that quickly turns simple marks into dense render expressions.

The rule is narrow. It focuses on obvious display-formatting calls inside SVG markup, not all function calls inside SVG.

## What It Reports

It warns when SVG markup contains raw inline formatting calls such as:

- `value.toLocaleString(...)`
- `value.toFixed(...)`

It does not warn when the display label was prepared before JSX and is only being rendered inside the mark tree.

It also does not warn on extracted formatter helpers such as `formatAxisCurrency(tick)`. That is already the refactor direction this rule is trying to encourage.

## Meridian Profile Status

- Rule ID: `meridian-local/no-inline-formatting-in-svg-marks`
- Category: Chart rendering readability
- `recommended`: not included
- `strict`: not included
- `pilot`: enabled

## Source of Truth

- Implementation: [no-inline-formatting-in-svg-marks.js](../../rules/no-inline-formatting-in-svg-marks.js)
- Tests:
  - [tests/rules/no-inline-formatting-in-svg-marks.test.js](../../tests/rules/no-inline-formatting-in-svg-marks.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

This rule has no options.

## Examples

### ❌ Incorrect

```tsx
function PriceChart({ point, tick }: Props) {
  return (
    <svg>
      <title>{point.price.toLocaleString("en-GB")}</title>
    </svg>
  );
}
```

### ✅ Correct

```tsx
function PriceChart({ pointLabel, tickLabel }: Props) {
  return (
    <svg>
      <text>{tickLabel}</text>
      <title>{pointLabel}</title>
    </svg>
  );
}
```

## Refactor Direction

Prepare display labels before the SVG JSX and pass plain strings into the mark tree. Extracted formatter helpers are fine. Raw locale and precision formatting inside the markup is what this rule is trying to catch.

## When To Disable

Disable only when the formatting call is trivial, clearly local, and extracting it would make the surrounding mark code harder to follow.
