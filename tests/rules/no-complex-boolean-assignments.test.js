import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-complex-boolean-assignments.js";
import { runRule, tsParser } from "./rule-test-utilities.js";

const RULE_NAME = "no-complex-boolean-assignments";

test("reports mixed boolean flag expressions with nested logical groups", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const confirmButtonDisabled =
        !targetPlan ||
        isSubmitting ||
        (!checkoutError && (!quote || dialogState === "loading-quote" || !quoteMatchesCadence));
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexBooleanAssignment");
});

test("reports long boolean-typed chains even when the name is neutral", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    parser: tsParser,
    code: `
      const disabled: boolean =
        isArchived ||
        isPendingDeletion ||
        isLocked ||
        isMissingPermissions;
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexBooleanAssignment");
});

test("reports boolean assignment expressions after declaration", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      let isUpgradeDisabled = false;

      isUpgradeDisabled =
        !targetPlan ||
        !billingReady ||
        (hasCheckoutError && (!quote || !quoteMatchesCadence));
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "complexBooleanAssignment");
});

test("allows short boolean checks", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const isReady = hasPlan && canSubmit;
    `
  });

  assert.equal(messages.length, 0);
});

test("allows small mixed-operator checks that stay under the density threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const hasEstimateSummary =
        dialogState === "loading-quote" || Boolean(quote && quoteMatchesCadence);
    `
  });

  assert.equal(messages.length, 0);
});

test("allows non-boolean fallback assignments", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const dialogTitle = explicitTitle || fallbackTitle || defaultTitle;
    `
  });

  assert.equal(messages.length, 0);
});
