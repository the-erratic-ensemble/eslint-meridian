import assert from "node:assert/strict";
import test from "node:test";
import rule from "../../rules/no-inline-collection-fallbacks.js";
import { runRule } from "./rule-test-utilities.js";

const RULE_NAME = "no-inline-collection-fallbacks";

test("reports inline map fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const jobs = response.jobs?.map((job) => ({ ...job, downloadUrl: normalize(job.downloadUrl) })) ?? [];
    `
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].messageId, "inlineCollectionFallback");
});

test("reports inline map fallback with ||", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const jobs = response.jobs?.map((job) => normalize(job)) || [];
    `
  });

  assert.equal(messages.length, 1);
});

test("allows a non-collection logical fallback", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const maybeJobs = response.jobs || [];
    `
  });

  assert.equal(messages.length, 0);
});

test("does not report repeated collection fallbacks", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rows.find((row) => row.primary) ??
        rows.filter((row) => row.fallback) ??
        null;
    `
  });

  assert.equal(messages.length, 0);
});

test("reports fallback chain when collection calls are from different receivers", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rows.find((row) => row.primary) ??
        fallbackRows.filter((row) => row.fallback) ??
        null;
    `
  });

  assert.equal(messages.length, 1);
});

test("does not report repeated collection fallback when the same receiver uses computed and dot property access", () => {
  const messages = runRule({
    ruleName: RULE_NAME,
    rule,
    code: `
      const selected =
        rowsByStatus["primary"].find((row) => row.primary) ??
        rowsByStatus.primary.filter((row) => row.fallback) ??
        [];
    `
  });

  assert.equal(messages.length, 0);
});
