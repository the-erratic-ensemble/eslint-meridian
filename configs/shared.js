import meridianLocalRulesPlugin from "../rules/eslint-local-rules.js";
import {
  meridianLocalPilotRuleProfile,
  meridianLocalRecommendedRuleProfile,
  meridianLocalStrictRuleProfile
} from "../rules/profile.js";

const defaultRuleLevel = "warn";

const groupedRuleMetadata = Object.freeze([
  { ruleId: "meridian-local/react19-no-forwardref", group: "reactContract" },
  { ruleId: "meridian-local/react-component-filename-pascal-case", group: "reactContract" },
  { ruleId: "meridian-local/no-inline-object-literals-in-jsx", group: "reactContract" },
  { ruleId: "meridian-local/no-inline-conditional-styles", group: "reactContract" },
  { ruleId: "meridian-local/prefer-classname-helper-module", group: "reactContract" },
  { ruleId: "meridian-local/no-jsx-in-variables", group: "reactContract" },
  { ruleId: "meridian-local/jsx-no-leaked-render", group: "reactContract" },
  { ruleId: "meridian-local/no-render-time-date-in-jsx", group: "reactContract" },
  { ruleId: "meridian-local/no-staged-conditional-class-tokens", group: "reactContract" },
  { ruleId: "meridian-local/no-complex-inline-handlers", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-complex-array-callbacks", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-complex-hook-callbacks", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-complex-jsx-collection-callback", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-complex-inline-object-methods", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-long-inline-object-methods", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-nested-ternary-in-jsx", group: "callbackComplexity" },
  { ruleId: "meridian-local/no-ternary-in-branch-assignment", group: "controlFlow" },
  { ruleId: "meridian-local/no-let-mutation-in-if-chain", group: "controlFlow" },
  { ruleId: "meridian-local/no-deep-control-flow-nesting", group: "controlFlow" },
  { ruleId: "meridian-local/no-nested-try", group: "controlFlow" },
  { ruleId: "meridian-local/no-long-if-else-chain", group: "controlFlow" },
  { ruleId: "meridian-local/no-deep-optional-chaining-conditions", group: "controlFlow" },
  { ruleId: "meridian-local/no-collection-methods-in-ternaries", group: "collectionReadability" },
  { ruleId: "meridian-local/no-collection-methods-on-spread-arrays", group: "collectionReadability" },
  { ruleId: "meridian-local/no-collection-constructor-pipelines", group: "collectionReadability" },
  { ruleId: "meridian-local/no-inline-spread-collection-pipelines", group: "collectionReadability" },
  { ruleId: "meridian-local/no-long-collection-method-chains", group: "collectionReadability" },
  { ruleId: "meridian-local/no-conditional-expressions-in-collection-callbacks", group: "collectionReadability" },
  { ruleId: "meridian-local/no-flatmap-present-items", group: "collectionReadability" },
  { ruleId: "meridian-local/no-conditional-collection-initializers", group: "collectionReadability" },
  { ruleId: "meridian-local/no-inline-collection-fallbacks", group: "collectionReadability" },
  { ruleId: "meridian-local/no-repeated-collection-method-fallbacks", group: "collectionReadability" },
  { ruleId: "meridian-local/no-indexed-collection-pipeline-fallbacks", group: "collectionReadability" },
  { ruleId: "meridian-local/no-set-map-from-flatmap", group: "collectionReadability" },
  { ruleId: "meridian-local/no-forbidden-declaration-names", group: "namingBoundaries" },
  { ruleId: "meridian-local/no-mixed-ui-and-domain-logic-in-component", group: "namingBoundaries" },
  { ruleId: "meridian-local/no-state-sync-useeffect", group: "namingBoundaries" }
]);

const allRuleIds = Object.keys(meridianLocalRulesPlugin.rules)
  .map((ruleName) => `meridian-local/${ruleName}`)
  .toSorted();

const cloneValue = (value) => structuredClone(value);

const buildRuleGroups = (metadata) =>
  metadata.reduce((groups, { group, ruleId }) => {
    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(ruleId);
    return groups;
  }, {});

export const meridianLocalRuleGroups = Object.freeze(buildRuleGroups(groupedRuleMetadata));

export function createRuleSelection(ruleIds, baseProfile = meridianLocalRecommendedRuleProfile) {
  return Object.fromEntries(
    ruleIds.map((ruleId) => {
      const configuredValue = baseProfile[ruleId];
      return [ruleId, configuredValue === undefined ? defaultRuleLevel : cloneValue(configuredValue)];
    })
  );
}

export function createFlatConfig(ruleSettings) {
  return {
    plugins: {
      "meridian-local": meridianLocalRulesPlugin
    },
    rules: cloneValue(ruleSettings)
  };
}

export const meridianLocalRecommendedConfigRules = cloneValue(meridianLocalRecommendedRuleProfile);
export const meridianLocalStrictConfigRules = cloneValue(meridianLocalStrictRuleProfile);
export const meridianLocalPilotConfigRules = cloneValue(meridianLocalPilotRuleProfile);
export const meridianLocalAllConfigRules = createRuleSelection(allRuleIds);

export const meridianLocalRecommendedConfig = createFlatConfig(meridianLocalRecommendedConfigRules);
export const meridianLocalStrictConfig = createFlatConfig(meridianLocalStrictConfigRules);
export const meridianLocalPilotConfig = createFlatConfig(meridianLocalPilotConfigRules);
export const meridianLocalAllConfig = createFlatConfig(meridianLocalAllConfigRules);

export const meridianLocalReactContractRules = createRuleSelection(meridianLocalRuleGroups.reactContract);
export const meridianLocalCallbackComplexityRules = createRuleSelection(meridianLocalRuleGroups.callbackComplexity);
export const meridianLocalControlFlowRules = createRuleSelection(meridianLocalRuleGroups.controlFlow);
export const meridianLocalCollectionReadabilityRules = createRuleSelection(meridianLocalRuleGroups.collectionReadability);
export const meridianLocalNamingBoundaryRules = createRuleSelection(meridianLocalRuleGroups.namingBoundaries);

export const meridianLocalReactContractConfig = createFlatConfig(meridianLocalReactContractRules);
export const meridianLocalCallbackComplexityConfig = createFlatConfig(meridianLocalCallbackComplexityRules);
export const meridianLocalControlFlowConfig = createFlatConfig(meridianLocalControlFlowRules);
export const meridianLocalCollectionReadabilityConfig = createFlatConfig(meridianLocalCollectionReadabilityRules);
export const meridianLocalNamingBoundaryConfig = createFlatConfig(meridianLocalNamingBoundaryRules);
