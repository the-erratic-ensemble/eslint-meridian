import assert from "node:assert/strict";
import test from "node:test";
import meridianLocalRulesPlugin from "../../eslint-local-rules.js";
import {
  createFlatConfig,
  createRuleSelection,
  meridianLocalAllConfig,
  meridianLocalAllConfigRules,
  meridianLocalCallbackComplexityRules,
  meridianLocalCollectionReadabilityRules,
  meridianLocalControlFlowRules,
  meridianLocalNamingBoundaryRules,
  meridianLocalRecommendedConfig,
  meridianLocalRecommendedConfigRules,
  meridianLocalReactContractRules,
  meridianLocalRuleGroups
} from "../../configs/index.js";

test("recommended config wires the canonical plugin and rules", () => {
  assert.equal(meridianLocalRecommendedConfig.plugins["meridian-local"], meridianLocalRulesPlugin);
  assert.deepEqual(meridianLocalRecommendedConfig.rules, meridianLocalRecommendedConfigRules);
});

test("all config covers the full exported plugin rule inventory", () => {
  const exportedRuleIds = Object.keys(meridianLocalRulesPlugin.rules)
    .map((ruleName) => `meridian-local/${ruleName}`)
    .toSorted();

  assert.deepEqual(Object.keys(meridianLocalAllConfigRules).toSorted(), exportedRuleIds);
  assert.deepEqual(Object.keys(meridianLocalAllConfig.rules).toSorted(), exportedRuleIds);
});

test("grouped rule selection preserves configured profile values and defaults unknown rules to warn", () => {
  const controlFlowSelection = createRuleSelection(meridianLocalRuleGroups.controlFlow);

  assert.equal(controlFlowSelection["meridian-local/no-nested-try"], "warn");
  assert.equal(controlFlowSelection["meridian-local/no-deep-optional-chaining-conditions"], "warn");

  const customSelection = createRuleSelection(["meridian-local/no-inline-object-literals-in-jsx"], {});

  assert.equal(customSelection["meridian-local/no-inline-object-literals-in-jsx"], "warn");
});

test("group taxonomy is a single consistent source for grouped rule exports", () => {
  const groupedRuleIds = Object.values(meridianLocalRuleGroups).flat();
  const groupedRuleIdSet = new Set(groupedRuleIds);

  assert.equal(groupedRuleIds.length, groupedRuleIdSet.size);

  for (const ruleId of groupedRuleIdSet) {
    assert.ok(ruleId in meridianLocalRulesPlugin.rules || ruleId.replace("meridian-local/", "") in meridianLocalRulesPlugin.rules);
  }

  assert.deepEqual(
    meridianLocalReactContractRules,
    createRuleSelection(meridianLocalRuleGroups.reactContract)
  );
  assert.deepEqual(
    meridianLocalCallbackComplexityRules,
    createRuleSelection(meridianLocalRuleGroups.callbackComplexity)
  );
  assert.deepEqual(meridianLocalControlFlowRules, createRuleSelection(meridianLocalRuleGroups.controlFlow));
  assert.deepEqual(
    meridianLocalCollectionReadabilityRules,
    createRuleSelection(meridianLocalRuleGroups.collectionReadability)
  );
  assert.deepEqual(
    meridianLocalNamingBoundaryRules,
    createRuleSelection(meridianLocalRuleGroups.namingBoundaries)
  );
});

test("createFlatConfig returns a standalone flat-config fragment", () => {
  const ruleSettings = {
    "meridian-local/no-nested-try": "warn"
  };
  const config = createFlatConfig(ruleSettings);

  assert.equal(config.plugins["meridian-local"], meridianLocalRulesPlugin);
  assert.deepEqual(config.rules, ruleSettings);
  assert.notEqual(config.rules, ruleSettings);
});
