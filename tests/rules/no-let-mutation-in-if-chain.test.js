import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-let-mutation-in-if-chain.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-let-mutation-in-if-chain";

test("reports initialized let mutated by following if else chain", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      let variant = "default";
      if (feature.isUnlimited) {
        variant = "secondary";
      } else if (feature.isLimitExceeded) {
        variant = "destructive";
      } else {
        variant = "default";
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidLetMutationChain");
});

test("reports when only some branches mutate the initialized let", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      let primaryActionsDescription = "";
      if (args.isAnonymous) {
        primaryActionsDescription = "Sign in first";
      } else if (args.isFreePlan) {
        primaryActionsDescription = "Upgrade later";
      } else if (args.workspaceSavedCount > 0) {
        primaryActionsDescription = "Already saved";
      }
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "avoidLetMutationChain");
});

test("ignores const declarations", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const variant = feature.isUnlimited ? "secondary" : "default";
      if (feature.isLimitExceeded) {
        log(variant);
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("ignores let declarations not immediately followed by if chain", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      let variant = "default";
      trackMetric();
      if (feature.isUnlimited) {
        variant = "secondary";
      }
    `
  });

  assert.equal(messages.length, 0);
});

test("ignores nested function mutations inside the chain", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      let variant = "default";
      if (feature.isUnlimited) {
        const apply = () => {
          variant = "secondary";
        };
        apply();
      }
    `
  });

  assert.equal(messages.length, 0);
});
