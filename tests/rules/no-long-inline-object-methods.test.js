import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../no-long-inline-object-methods.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-long-inline-object-methods";

test("allows short inline object arrow methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        loadHistory: () => {
          const history = loadTenantHistory();
          set({ history });
        }
      };
    `
  });

  assert.equal(messages.length, 0);
});

test("reports long inline object arrow methods", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        fetchAutocomplete: async (query, limit = 10) => {
          const validation = validateSearchQuery(query);
          if (!validation.isValid) {
            setError(validation.error);
            return;
          }
          clearError();
          setLoading(true);
        }
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooLong");
});

test("reports object method shorthand", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const handlers = {
        saveDraft() {
          prepare();
          write();
          audit();
          notify();
        }
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooLong");
});

test("ignores blank lines and comment-only lines", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        fetchAutocomplete: async () => {
          const validation = validateSearchQuery(query);

          // keep loading state aligned with current request
          setLoading(true);

          /*
           * this comment block should not count as code mass
           */
          clearError();
        }
      };
    `
  });

  assert.equal(messages.length, 0);
});

test("reports getter methods when code lines exceed threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const store = {
        get snapshot() {
          prepare();
          write();
          audit();
          notify();
        }
      };
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "tooLong");
});

test("supports custom line threshold", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    options: [{ maxBodyLines: 7 }],
    code: `
      const store = {
        fetchAutocomplete: async (query, limit = 10) => {
          const validation = validateSearchQuery(query);
          if (!validation.isValid) {
            setError(validation.error);
            return;
          }
          clearError();
          setLoading(true);
        }
      };
    `
  });

  assert.equal(messages.length, 0);
});
