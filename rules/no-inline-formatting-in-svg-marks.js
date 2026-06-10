import {
  collectSvgExpressionContainers,
  getFunctionName,
  getReturnedJsxRoots,
  isFunctionNode,
  walkWithoutNestedFunctions,
} from "./chart-rendering-shared.js";

const FORMAT_METHOD_NAMES = new Set([
  "toLocaleString",
  "toFixed",
  "toPrecision",
  "toExponential",
]);

function isFormattingCall(node) {
  if (!node || node.type !== "CallExpression") {
    return false;
  }

  if (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier" &&
    FORMAT_METHOD_NAMES.has(node.callee.property.name)
  ) {
    return true;
  }

  return false;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      inlineFormattingInSvgMarks:
        "Component '{{name}}' formats display values inline inside SVG markup. Prepare the display label before the mark JSX.",
    },
  },

  create(context) {
    function checkFunction(node) {
      if (!isFunctionNode(node) || getFunctionName(node) === "function") {
        return;
      }

      const reportedNodes = new Set();

      for (const returnedRoot of getReturnedJsxRoots(node)) {
        for (const container of collectSvgExpressionContainers(returnedRoot)) {
          walkWithoutNestedFunctions(container.expression, (child) => {
            if (!isFormattingCall(child)) {
              return;
            }

            const key =
              child.range?.join(":") ??
              `${child.loc?.start.line}:${child.loc?.start.column}`;
            if (reportedNodes.has(key)) {
              return;
            }

            reportedNodes.add(key);
            context.report({
              node: child,
              messageId: "inlineFormattingInSvgMarks",
              data: {
                name: getFunctionName(node),
              },
            });
          });
        }
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
