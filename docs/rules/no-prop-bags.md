# no-prop-bags

Avoid component props types that hide several nested prop bags inside one top-level API.

## Why This Rule Exists

AI-generated component APIs often collapse several unrelated prop clusters into nested objects such as `handlers`, `ids`, `checkout`, or `action`. That shape makes the component boundary harder to scan because the real API is spread across several mini-APIs inside the same props type.

This rule does not ban every nested object prop. It enforces two narrower constraints:

- no more than `2` nested prop bags inside one `*Props` type by default
- no more than `5` top-level fields inside any one nested bag by default

That still allows small grouped props where they are genuinely clearer, while flagging the “component API hidden inside several bags” pattern.

## What It Reports

It inspects TypeScript `interface` and `type` declarations whose names end with `Props`.

It reports when one of these is true:

- the props type contains more than the configured maximum number of nested object-shaped bag props
- one nested bag contains more than the configured maximum number of top-level fields

The rule currently resolves:

- inline nested object literals
- local interface or type-alias references that resolve to object-like members
- simple wrappers such as `Readonly<T>`, `Partial<T>`, and `Required<T>`

It intentionally does not try to resolve every imported type, indexed-access type, or utility-heavy generic shape.

## Meridian Profile Status

- Rule ID: `meridian-local/no-prop-bags`
- Category: React and component contract
- `recommended`: not included
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-prop-bags.js](../../rules/no-prop-bags.js)
- Tests:
  - [tests/rules/no-prop-bags.test.js](../../tests/rules/no-prop-bags.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `maxBags` (default: `2`) — maximum number of nested object-shaped bag props allowed inside one `*Props` declaration
- `maxPropsPerBag` (default: `5`) — maximum number of top-level fields allowed inside any one nested bag

## Examples

### ❌ Incorrect

```tsx
interface LoginFormFieldsProps {
  formData: LoginFormData;
  errors: LoginFormErrors;
  isLoading: boolean;
  showPassword: boolean;
  describedBy: {
    email: string;
    password: string;
  };
  ids: {
    emailDescription: string;
    emailError: string;
    passwordDescription: string;
    passwordError: string;
  };
  handlers: {
    handleEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleTogglePassword: () => void;
    handleRememberMeChange: (checked: boolean) => void;
  };
}
```

```tsx
type BillingPlansPlanChangeDialogProps = {
  billingCadence: BillingCadence;
  currentPlanLabel: string;
  dialogState: CheckoutDialogState;
  checkout: {
    checkoutError: string | null;
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    quote: PlanUpgradeQuote | null;
    quoteError: string | null;
    targetPlan: Plan | null;
  };
};
```

### ✅ Correct

```tsx
interface SuccessMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

```tsx
interface LoginFormFieldsProps {
  formData: LoginFormData;
  errors: LoginFormErrors;
  isLoading: boolean;
  showPassword: boolean;
  emailDescriptionId: string;
  passwordDescriptionId: string;
  emailErrorId: string;
  passwordErrorId: string;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
}
```

## Refactor Direction

Prefer one of these moves:

- flatten the nested fields into the main component props when the grouping is only hiding the real API
- extract a child component so one nested bag becomes the child component’s own top-level props
- move real domain data into a named model type and keep UI wiring props separate

## When To Disable

Disable only when the nested grouping is a deliberate, stable boundary and flattening it would make the component contract harder to understand.
