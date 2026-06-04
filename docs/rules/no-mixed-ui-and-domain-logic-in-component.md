# no-mixed-ui-and-domain-logic-in-component

Warn on PascalCase components that mix heavy domain/control logic with JSX rendering.

## Why This Rule Exists

Components are easiest to maintain when they render prepared view models instead of inventing domain shaping, aggregation, and control logic inline. Mixing both concerns produces components that are visually simple but behaviorally dense.

## What It Reports

It targets PascalCase components that render JSX and also contain more than the configured amount of heavy control-flow or shaping logic.

## Meridian Profile Status

- Rule ID: `meridian-local/no-mixed-ui-and-domain-logic-in-component`
- Category: Hooks and component boundaries
- `recommended`: not included
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-mixed-ui-and-domain-logic-in-component.js](no-mixed-ui-and-domain-logic-in-component.js)
- Tests: No standalone rule test file exists yet. Current coverage is indirect through profile or package-level validation, so treat docs and implementation as the primary sources until dedicated tests land.

## Rule Options

- `maxComplexityNodes` (default: `6`) — maximum allowed complexity node count in render-containing functions.

## Examples

### ❌ Incorrect

```jsx
function ResultsList({ items }) {
  const buckets = items
    .filter(Boolean)
    .map(normalize)
    .reduce((acc, item) => {
      if (item.type === "premium") acc.premium.push(item);
      if (item.type === "free") acc.free.push(item);
      if (item.active) acc.active = true;
      return acc;
    }, {});
  return <List buckets={buckets} />;
}
```

### ✅ Correct

```jsx
function ResultsList({ items }) {
  const buckets = deriveBuckets(items);
  return <List buckets={buckets} />;
}
```

## Meridian-Style Example

### Before

```tsx
function AreaSummaryPanel({ areas }) {
  const grouped = areas.reduce(
    (acc, area) => {
      if (area.type === "postcode") acc.postcodes.push(area);
      if (area.type === "district") acc.districts.push(area);
      if (area.isPremium) acc.hasPremium = true;
      return acc;
    },
    { postcodes: [], districts: [], hasPremium: false }
  );

  return <SummaryCard grouped={grouped} />;
}
```

### After

```tsx
function buildAreaSummaryViewModel(areas) {
  return areas.reduce(
    (acc, area) => {
      if (area.type === "postcode") acc.postcodes.push(area);
      if (area.type === "district") acc.districts.push(area);
      if (area.isPremium) acc.hasPremium = true;
      return acc;
    },
    { postcodes: [], districts: [], hasPremium: false }
  );
}

function AreaSummaryPanel({ areas }) {
  const grouped = buildAreaSummaryViewModel(areas);
  return <SummaryCard grouped={grouped} />;
}
```

## Edge Cases and False Positives

- This rule targets components that both render JSX and accumulate enough branching or shaping logic to cross a readability threshold. UI-local toggles, hover state, and tiny display transforms are not the target.
- Use it when the component starts inventing taxonomy, pricing, access, or derived aggregation logic inline. Do not treat every helper-worthy component as a domain-boundary violation.

## Refactor Direction

Move domain shaping into a helper, feature service, selector, or mapper boundary so the component mostly reads as a view over prepared data.

## When To Disable

Disable when the complexity is genuinely UI-local and extracting it would create a false domain boundary rather than a cleaner view-model boundary.
