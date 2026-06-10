# no-excessive-component-props

Avoid React components that accumulate too many top-level props in one API.

## Why This Rule Exists

Large component prop lists are hard to scan and usually indicate that one component owns too many responsibilities. AI-generated code often grows these APIs by continuing to add one more prop instead of splitting the boundary.

This rule is intentionally simple. It counts the top-level props exposed by a component and warns once the count exceeds the configured maximum.

## What It Reports

It warns on PascalCase React components when the resolved top-level props count exceeds the configured `max`.

It currently supports:

- inline typed destructured params
- local `type` and `interface` props declarations
- `React.FC<Props>` and `React.FunctionComponent<Props>`
- simple wrappers such as `memo(function Component(...) { ... })`
- simple type wrappers such as `Readonly<T>`, `Partial<T>`, `Required<T>`, `Pick<T, ...>`, and `Omit<T, ...>` when the underlying local props type is resolvable

It intentionally does not try to fully resolve arbitrary imported generic types.

## Meridian Profile Status

- Rule ID: `meridian-local/no-excessive-component-props`
- Category: React and component contract
- `recommended`: not included
- `strict`: enabled
- `pilot`: enabled

## Source of Truth

- Implementation: [no-excessive-component-props.js](../../rules/no-excessive-component-props.js)
- Tests:
  - [tests/rules/no-excessive-component-props.test.js](../../tests/rules/no-excessive-component-props.test.js)
  - [tests/rules/eslint-local-inline-rules.test.js](../../tests/rules/eslint-local-inline-rules.test.js)
  - [tests/rules/oxlint-meridian-local-plugin.test.js](../../tests/rules/oxlint-meridian-local-plugin.test.js)

## Rule Options

- `max` (default: `8`) — maximum number of top-level props allowed for one component

## Examples

### ❌ Incorrect

```tsx
function LoginPageFormCard({
  emailField,
  passwordField,
  rememberMeField,
  submitLabel,
  errorMessage,
  isHydrated,
  isLoading,
  onSubmit,
  onForgotPassword,
}: {
  emailField: string;
  passwordField: string;
  rememberMeField: boolean;
  submitLabel: string;
  errorMessage: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  onForgotPassword: () => void;
}) {
  return <form>{submitLabel}</form>;
}
```

### ✅ Correct

```tsx
function LoginFormFields({
  formData,
  errors,
  isLoading,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRememberMeChange,
}: LoginFormFieldsProps) {
  return <form>{formData.email}</form>;
}
```

## Refactor Direction

Prefer one of these moves:

- extract a child component with its own smaller props contract
- move display-only values into a prepared model object owned outside the component
- split one broad component into smaller UI sections with tighter boundaries

## When To Disable

Disable only when the wide prop surface is deliberate, stable, and still easier to understand than the extra component boundaries that would replace it.
