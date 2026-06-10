import {
  functionReturnsJsx,
  getFunctionName,
  getManualFindLoopSignals,
  isFunctionNode,
} from "./chart-rendering-shared.js";

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      manualActiveItemScan:
        "Component '{{name}}' manually scans for '{{targetName}}' before render with a loop and break. Prefer a direct `.find(...)` or a prepared selector.",
    },
  },

  create(context) {
    function checkFunction(node) {
      if (!isFunctionNode(node) || !functionReturnsJsx(node)) {
        return;
      }

      for (const signal of getManualFindLoopSignals(node)) {
        context.report({
          node: signal.node,
          messageId: "manualActiveItemScan",
          data: {
            name: getFunctionName(node),
            targetName: signal.targetName,
          },
        });
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
