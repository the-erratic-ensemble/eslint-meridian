import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-excessive-component-props.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-excessive-component-props";

test("reports components with more than eight inline destructured props", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function LoginPageFormCard({
        emailField,
        passwordField,
        rememberMeField,
        submitLabel,
        errorMessage,
        isHydrated,
        isLoading,
        onSubmit,
        onForgotPassword
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
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyProps");
});

test("reports React.FC components backed by a local props interface", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      interface DiscoveryCardProps {
        icon: React.ReactNode;
        title: string;
        description: string;
        href: string;
        eyebrow: string;
        badge: string;
        ctaLabel: string;
        isNew: boolean;
        onSelect: () => void;
      }

      const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
        title
      }) => <article>{title}</article>;
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyProps");
});

test("reports memo-wrapped components with too many props", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      export const MetricsSection = memo(function MetricsSection({
        planData,
        renewalDate,
        renewalLabel,
        usageLabel,
        usageValue,
        trialEndsAt,
        trialLabel,
        actionLabel,
        onUpgrade
      }: {
        planData: string;
        renewalDate: string;
        renewalLabel: string;
        usageLabel: string;
        usageValue: string;
        trialEndsAt: string | null;
        trialLabel: string;
        actionLabel: string;
        onUpgrade: () => void;
      }) {
        return <section>{usageLabel}</section>;
      });
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyProps");
});

test("allows components with eight props", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      function SearchPrompt({
        query,
        label,
        hint,
        status,
        onChange,
        onClear,
        onFocus,
        onBlur
      }: {
        query: string;
        label: string;
        hint: string;
        status: string;
        onChange: () => void;
        onClear: () => void;
        onFocus: () => void;
        onBlur: () => void;
      }) {
        return <div>{label}</div>;
      }
    `,
  });

  assert.equal(messages.length, 0);
});

test("supports custom max thresholds", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    options: [{ max: 10 }],
    code: `
      function SearchPrompt({
        query,
        label,
        hint,
        status,
        onChange,
        onClear,
        onFocus,
        onBlur,
        onSubmit
      }: {
        query: string;
        label: string;
        hint: string;
        status: string;
        onChange: () => void;
        onClear: () => void;
        onFocus: () => void;
        onBlur: () => void;
        onSubmit: () => void;
      }) {
        return <div>{label}</div>;
      }
    `,
  });

  assert.equal(messages.length, 0);
});
