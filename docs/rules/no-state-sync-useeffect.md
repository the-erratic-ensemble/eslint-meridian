# no-state-sync-useeffect

Warn on trivial effects that merely mirror one value into local state.

## Why This Rule Exists

Effects that only mirror one value into local state usually create redundant state, extra renders, and stale-state risk without adding real behavior.

## What It Reports

It looks for trivial sync effects where a hook callback only calls a setter with a value that already appears in the dependency array.

## Meridian Profile Status

- Rule ID: `meridian-local/no-state-sync-useeffect`
- Category: Hooks and component boundaries
- `recommended`: enabled
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-state-sync-useeffect.js](../../rules/no-state-sync-useeffect.js)
- Tests:
  - [tests/rules/no-state-sync-useeffect.test.js](../../tests/rules/no-state-sync-useeffect.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `hooks` (default: `["useEffect", "useLayoutEffect"]`)
- `setterPattern` (default: `"^set[A-Z]"`) — setter name regex.

## Examples

### ❌ Incorrect

```js
useEffect(() => {
  setValue(sourceValue);
}, [sourceValue]);
```

### ✅ Correct

```js
const value = deriveValue(sourceValue);
```

## Meridian-Style Example

### Before

```tsx
function AnalysisPane({ selectedPostcode }) {
  const [activePostcode, setActivePostcode] = useState(selectedPostcode);

  useEffect(() => {
    setActivePostcode(selectedPostcode);
  }, [selectedPostcode]);

  return <PostcodeSummary postcode={activePostcode} />;
}
```

### After

```tsx
function AnalysisPane({ selectedPostcode }) {
  return <PostcodeSummary postcode={selectedPostcode} />;
}
```

## Edge Cases and False Positives

- The rule only reports the narrow mirror shape where an effect or layout-effect body just calls a setter with a dependency-backed value. It is not trying to ban all synchronization effects.
- Effects that bridge to imperative widgets, buffered editors, or external caches can still be legitimate. The red flag is local state that only copies another local render-time value.
- Guarded sync blocks, transformed writes, alias setters, and multi-statement effects are intentionally outside the default rule contract.

## Refactor Direction

Derive the value directly during render, memoize it if needed, or redesign state ownership so the mirrored state disappears entirely.

## When To Disable

Disable when the setter call is intentionally bridging to imperative state that cannot be derived purely from props or local render-time data.
