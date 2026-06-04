import noComplexInlineHandlersRule from "./no-complex-inline-handlers.js";
import noComplexArrayCallbacksRule from "./no-complex-array-callbacks.js";
import noCollectionMethodsInTernariesRule from "./no-collection-methods-in-ternaries.js";
import noCollectionMethodsOnSpreadArraysRule from "./no-collection-methods-on-spread-arrays.js";
import noCollectionConstructorPipelinesRule from "./no-collection-constructor-pipelines.js";
import noInlineSpreadCollectionPipelinesRule from "./no-inline-spread-collection-pipelines.js";
import noConditionalExpressionsInCollectionCallbacksRule from "./no-conditional-expressions-in-collection-callbacks.js";
import noFlatMapPresentItemsRule from "./no-flatmap-present-items.js";
import noConditionalCollectionInitializersRule from "./no-conditional-collection-initializers.js";
import noInlineCollectionFallbacksRule from "./no-inline-collection-fallbacks.js";
import noRepeatedCollectionMethodFallbacksRule from "./no-repeated-collection-method-fallbacks.js";
import noIndexedCollectionPipelineFallbacksRule from "./no-indexed-collection-pipeline-fallbacks.js";
import noSetMapFromFlatMapRule from "./no-set-map-from-flatmap.js";
import noComplexHookCallbacksRule from "./no-complex-hook-callbacks.js";
import noComplexJsxCollectionCallbackRule from "./no-complex-jsx-collection-callback.js";
import noComplexInlineObjectMethodsRule from "./no-complex-inline-object-methods.js";
import noLongInlineObjectMethodsRule from "./no-long-inline-object-methods.js";
import noInlineConditionalStylesRule from "./no-inline-conditional-styles.js";
import noJsxInVariablesRule from "./no-jsx-in-variables.js";
import noRenderTimeDateInJsxRule from "./no-render-time-date-in-jsx.js";
import noNestedTernaryInJsxRule from "./no-nested-ternary-in-jsx.js";
import noLongIfElseChainRule from "./no-long-if-else-chain.js";
import noLongCollectionMethodChainsRule from "./no-long-collection-method-chains.js";
import noNestedTryRule from "./no-nested-try.js";
import noTernaryInBranchAssignmentRule from "./no-ternary-in-branch-assignment.js";
import noLetMutationInIfChainRule from "./no-let-mutation-in-if-chain.js";
import noDeepControlFlowNestingRule from "./no-deep-control-flow-nesting.js";
import noInlineObjectLiteralsInJsxRule from "./no-inline-object-literals-in-jsx.js";
import jsxNoLeakedRenderRule from "./jsx-no-leaked-render.js";
import noStateSyncUseEffectRule from "./no-state-sync-useeffect.js";
import noDeepOptionalChainingConditionsRule from "./no-deep-optional-chaining-conditions.js";
import noMixedUiAndDomainLogicInComponentRule from "./no-mixed-ui-and-domain-logic-in-component.js";
import noStagedConditionalClassTokensRule from "./no-staged-conditional-class-tokens.js";
import preferClassnameHelperModuleRule from "./prefer-classname-helper-module.js";
import react19NoForwardReferenceRule from "./react19-no-forwardref.js";
import noForbiddenDeclarationNamesRule from "./no-forbidden-declaration-names.js";
import reactComponentFilenamePascalCaseRule from "./react-component-filename-pascal-case.js";

const LOCAL_RULES = {
  "no-complex-inline-handlers": noComplexInlineHandlersRule,
  "no-complex-array-callbacks": noComplexArrayCallbacksRule,
  "no-collection-methods-in-ternaries": noCollectionMethodsInTernariesRule,
  "no-collection-methods-on-spread-arrays": noCollectionMethodsOnSpreadArraysRule,
  "no-collection-constructor-pipelines": noCollectionConstructorPipelinesRule,
  "no-inline-spread-collection-pipelines": noInlineSpreadCollectionPipelinesRule,
  "no-conditional-expressions-in-collection-callbacks": noConditionalExpressionsInCollectionCallbacksRule,
  "no-flatmap-present-items": noFlatMapPresentItemsRule,
  "no-conditional-collection-initializers": noConditionalCollectionInitializersRule,
  "no-inline-collection-fallbacks": noInlineCollectionFallbacksRule,
  "no-repeated-collection-method-fallbacks": noRepeatedCollectionMethodFallbacksRule,
  "no-indexed-collection-pipeline-fallbacks": noIndexedCollectionPipelineFallbacksRule,
  "no-set-map-from-flatmap": noSetMapFromFlatMapRule,
  "no-complex-hook-callbacks": noComplexHookCallbacksRule,
  "no-complex-jsx-collection-callback": noComplexJsxCollectionCallbackRule,
  "no-complex-inline-object-methods": noComplexInlineObjectMethodsRule,
  "no-long-inline-object-methods": noLongInlineObjectMethodsRule,
  "no-inline-conditional-styles": noInlineConditionalStylesRule,
  "no-jsx-in-variables": noJsxInVariablesRule,
  "no-render-time-date-in-jsx": noRenderTimeDateInJsxRule,
  "no-nested-ternary-in-jsx": noNestedTernaryInJsxRule,
  "no-long-if-else-chain": noLongIfElseChainRule,
  "no-long-collection-method-chains": noLongCollectionMethodChainsRule,
  "no-nested-try": noNestedTryRule,
  "no-ternary-in-branch-assignment": noTernaryInBranchAssignmentRule,
  "no-let-mutation-in-if-chain": noLetMutationInIfChainRule,
  "no-deep-control-flow-nesting": noDeepControlFlowNestingRule,
  "no-inline-object-literals-in-jsx": noInlineObjectLiteralsInJsxRule,
  "jsx-no-leaked-render": jsxNoLeakedRenderRule,
  "no-state-sync-useeffect": noStateSyncUseEffectRule,
  "no-deep-optional-chaining-conditions": noDeepOptionalChainingConditionsRule,
  "no-mixed-ui-and-domain-logic-in-component": noMixedUiAndDomainLogicInComponentRule,
  "no-staged-conditional-class-tokens": noStagedConditionalClassTokensRule,
  "prefer-classname-helper-module": preferClassnameHelperModuleRule,

  "react19-no-forwardref": react19NoForwardReferenceRule,

  "no-forbidden-declaration-names": noForbiddenDeclarationNamesRule,
  "react-component-filename-pascal-case": reactComponentFilenamePascalCaseRule
};

const meridianLocalRulesPlugin = {
  meta: {
    name: "@meridian/eslint-local-rules"
  },
  rules: LOCAL_RULES
};

export default meridianLocalRulesPlugin;
