# prefer-reusable-jsx-component

Suggest a reusable component for substantial repeated JSX sibling structures.

## Why This Rule Exists

Repeated markup creates several copies of the same component contract. Structural comparison can identify extraction opportunities even when labels, icons, styles, and expression values vary between each copy.

## What It Reports

The rule reports consecutive sibling JSX elements with the same nested element structure, attribute names, and value kinds. Whitespace, JSX comments, text content, literal values, identifier names, and self-closing component names are treated as variable slots.

The default threshold requires three copies containing at least six JSX elements each. One diagnostic covers the complete repeated run.

## Meridian Profile Status

- Rule ID: `meridian-local/prefer-reusable-jsx-component`
- Category: React and component contract
- `recommended`: disabled
- `strict`: disabled
- `pilot`: enabled

## Source of Truth

- Implementation: [prefer-reusable-jsx-component.js](../../rules/prefer-reusable-jsx-component.js)

## Rule Options

- `minOccurrences` (default: `3`): minimum consecutive matching siblings.
- `minElements` (default: `6`): minimum JSX element count within each sibling block.

## Examples

### ❌ Incorrect

```jsx
<section>
  <div>
    <IconA />
    <span>Cash at Bank</span>
    <span>£78m</span>
    <span>Secure</span>
    <small>Available</small>
  </div>
  <div>
    <IconB />
    <span>Credit Facilities</span>
    <span>£20m</span>
    <span>Unused</span>
    <small>Available</small>
  </div>
  <div>
    <IconC />
    <span>Net Debt</span>
    <span>£0</span>
    <span>None</span>
    <small>Available</small>
  </div>
</section>
```

### ✅ Correct

```jsx
<section>
  {financeItems.map((item) => (
    <FinanceItem key={item.label} {...item} />
  ))}
</section>
```

## Edge Cases and False Positives

- Intrinsic element names and attribute names remain part of the comparison.
- Expression syntax remains structural, so different expression forms separate candidate runs.
- A higher `minElements` value suits codebases with intentionally parallel markup.
- The rule compares siblings within one JSX container. Cross-file clone detection belongs in a dedicated duplication analyzer.

## Refactor Direction

Extract the shared JSX shape into a named component with explicit props, then render repeated data through that boundary.

## When To Disable

Use a local override for intentionally parallel semantic regions whose matching markup remains clearer when written separately.
