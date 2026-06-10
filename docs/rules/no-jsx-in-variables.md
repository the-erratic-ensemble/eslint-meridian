# no-jsx-in-variables

Avoid assigning JSX render payloads to variables; keep JSX close to render paths or extract components.

## Why This Rule Exists

Assigning JSX to variables often separates UI fragments from the render path that explains why they exist. That can make control flow harder to follow and encourages pseudo-template patterns instead of components or direct conditional rendering.

The rule is intentionally narrow. It targets stored render payloads, not every object or array that happens to carry JSX somewhere inside it.

## What It Reports

It warns when JSX is assigned directly to a variable instead of being returned inline or extracted into a component.

It also warns when a variable stores the result of calling a local helper that is explicitly typed to return `JSX.Element`, `JSX.Element | null`, or a similar JSX-like return type.
That case is more prescriptive than the generic warning: the intended refactor is to convert the helper into a component and render it with JSX instead of storing the helper result.

It also warns when a variable is used as a lookup table of direct JSX payloads, for example a `Record<Status, ReactNode>` where each entry is a JSX branch.

It does not warn on richer config/data objects whose nested fields include JSX, such as `icon: <MapPin />`.

## Meridian Profile Status

- Rule ID: `meridian-local/no-jsx-in-variables`
- Category: JSX and styling hygiene
- `recommended`: not included
- `strict`: not included
- `pilot`: not included

## Source of Truth

- Implementation: [no-jsx-in-variables.js](../../rules/no-jsx-in-variables.js)
- Tests:
  - [tests/rules/no-jsx-in-variables.test.js](../../tests/rules/no-jsx-in-variables.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)

## Rule Options

- `allowNamePattern` (default: `null`) — regex for variable names permitted to hold JSX.

## Examples

### ❌ Incorrect

```tsx
const panel = showPanel ? <Panel /> : null;
```

```tsx
function availabilityDisclosureNode(model: Model): JSX.Element | null {
  if (!model.hasAvailability) {
    return null;
  }

  return <AvailabilityDisclosure model={model} />;
}

const availabilityDisclosure = availabilityDisclosureNode(model);
```

```tsx
const errorContent = result.kind === "ok" ? null : errorCard(result);
```

```tsx
const sectionsMap: Record<TabId, React.ReactNode> = {
  overview: <OverviewPanel />,
  settings: <SettingsPanel />,
};
```

### ✅ Correct

```tsx
return showPanel ? <Panel /> : null;
```

```tsx
function AvailabilityDisclosureNode({
  model,
}: {
  model: Model;
}): JSX.Element | null {
  if (!model.hasAvailability) {
    return null;
  }

  return <AvailabilityDisclosure model={model} />;
}

return <AvailabilityDisclosureNode model={model} />;
```

```tsx
return (
  <>
    {activeTab === "overview" ? <OverviewPanel /> : null}
    {activeTab === "settings" ? <SettingsPanel /> : null}
  </>
);
```

```tsx
const tabPanels = {
  overview: OverviewPanel,
  settings: SettingsPanel,
} as const;

const ActivePanel = tabPanels[activeTab];

return <ActivePanel />;
```

```tsx
const menuAction = {
  label: "Area",
  description: "Open the area overview.",
  icon: <MapPin size={14} />,
};
```

## Refactor Direction

Keep the JSX close to the return path or extract a dedicated component when the fragment has its own responsibility.

When the stored value comes from a local JSX-returning helper call, convert that helper into a proper component and render it with `<Name />` instead of calling it and storing the result.

For direct JSX lookup tables:

- If each branch is substantial, extract standalone components and map keys to component references instead of JSX instances.
- If the branches are small, move the condition or `switch` closer to the `return`.
- If the structure is really config, keep the config object and only store primitive data or component references there.

### Preferred Config-Driven Pattern

When the variants are mostly copy, tone, and small visual differences, prefer a config-driven component pattern:

```tsx
type AccessPanelConfig = {
  title: string;
  description: string;
  buttonLabel: string;
  buttonVariant: ButtonVariant;
  showIcon?: boolean;
};

const ACCESS_PANEL_CONFIGS: Record<ApiAccessState, AccessPanelConfig> = {
  unavailable: {
    title: "API access requires a plan upgrade",
    description: "Upgrade your plan to unlock API credentials.",
    buttonLabel: "Contact support",
    buttonVariant: "outline",
    showIcon: true,
  },
  self_serve: {
    title: "API access is enabled",
    description: "Contact support to provision credentials.",
    buttonLabel: "Contact support",
    buttonVariant: "outline",
  },
  sales_setup: {
    title: "API access requires setup",
    description: "We handle setup through the sales team.",
    buttonLabel: "Contact support",
    buttonVariant: "primary",
  },
};

function ApiAccessCard({
  config,
  onContactSales,
}: {
  config: AccessPanelConfig;
  onContactSales: () => void;
}): JSX.Element {
  return (
    <div>
      {config.showIcon ? <ApiAccessIcon /> : null}
      <h3>{config.title}</h3>
      <p>{config.description}</p>
      <Button variant={config.buttonVariant} onClick={onContactSales}>
        {config.buttonLabel}
      </Button>
    </div>
  );
}
```

This is a good fit when:

- the config is actual data, not hidden markup
- the rendering structure stays stable across variants
- the extracted component still reads clearly with a small prop surface

Avoid pushing this pattern too far. If the config starts carrying many JSX fields, large className payloads, or many one-off layout toggles, that usually means the variants want separate components instead of one config object.

## When To Disable

Disable when a local JSX variable clearly improves readability by naming a complex branch or avoiding repeated markup, and the component extraction or inline branch would be materially worse.
