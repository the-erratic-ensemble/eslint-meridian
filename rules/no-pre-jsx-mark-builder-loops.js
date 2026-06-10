import {
  functionReturnsJsx,
  getFunctionName,
  getImperativeJsxArrayBuilders,
  isFunctionNode,
} from "./chart-rendering-shared.js";

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when components build rendered JSX mark arrays imperatively before returning JSX",
    },
    schema: [],
    messages: {
      imperativeJsxMarkBuilder:
        "Component '{{name}}' builds rendered JSX array '{{arrayName}}' imperatively before return. Prefer a JSX map or extract a mark-rendering component.",
    },
  },

  create(context) {
    function checkFunction(node) {
      if (!isFunctionNode(node) || !functionReturnsJsx(node)) {
        return;
      }

      for (const builder of getImperativeJsxArrayBuilders(node)) {
        context.report({
          node: builder.node,
          messageId: "imperativeJsxMarkBuilder",
          data: {
            name: getFunctionName(node),
            arrayName: builder.name,
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
