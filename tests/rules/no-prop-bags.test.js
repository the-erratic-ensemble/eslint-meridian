import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-prop-bags.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-prop-bags";

test("reports props types that accumulate too many nested bag props", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      interface LoginFormFieldsProps {
        formData: LoginFormData;
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
          handleEmailChange: () => void;
          handlePasswordChange: () => void;
          handleTogglePassword: () => void;
          handleRememberMeChange: () => void;
        };
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyPropBags");
});

test("reports nested bag props that exceed the configured field limit", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      type BillingPlansPlanChangeDialogProps = {
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
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "propBagTooLarge");
});

test("counts locally referenced object-shaped bag aliases", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      type FieldDescriptions = {
        email: string;
        password: string;
      };

      interface FieldIds {
        emailDescription: string;
        emailError: string;
        passwordDescription: string;
        passwordError: string;
      }

      type FieldHandlers = {
        handleEmailChange: () => void;
        handlePasswordChange: () => void;
        handleTogglePassword: () => void;
        handleRememberMeChange: () => void;
      };

      interface LoginFormFieldsProps {
        describedBy: FieldDescriptions;
        ids: FieldIds;
        handlers: FieldHandlers;
      }
    `,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooManyPropBags");
});

test("allows one or two small nested bags", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      interface SuccessMessageProps {
        title?: string;
        action?: {
          label: string;
          onClick: () => void;
        };
        recoveryAction?: {
          href: string;
          label: string;
        };
      }
    `,
  });

  assert.equal(messages.length, 0);
});

test("supports option overrides for more permissive surfaces", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    options: [{ maxBags: 3, maxPropsPerBag: 7 }],
    code: `
      interface LoginFormFieldsProps {
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
          handleEmailChange: () => void;
          handlePasswordChange: () => void;
          handleTogglePassword: () => void;
          handleRememberMeChange: () => void;
        };
      }
    `,
  });

  assert.equal(messages.length, 0);
});
