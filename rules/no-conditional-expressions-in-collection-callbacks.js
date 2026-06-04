const DEFAULT_METHODS = ["map", "filter", "find", "some", "every", "reduce"];

function isFunctionNode(node) {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression" ||
    node?.type === "FunctionDeclaration"
  );
}

function getMethodName(node) {
  if (
    node?.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property?.type === "Identifier"
  ) {
    return node.callee.property.name;
  }

  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [
      {
        type: "object",
        properties: {
          methods: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      conditionalExpression:
        "Do not compress conditional expressions into {{method}} callbacks. Use staged control flow or a named helper."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      CallExpression(node) {
        const method = getMethodName(node);
        if (!method || !options.methods.includes(method)) {
          return;
        }

        const callback = node.arguments.find(isFunctionNode);
        if (!callback || callback.body.type !== "ConditionalExpression") {
          return;
        }

        const returnsStructuredBranch =
          callback.body.consequent.type === "ArrayExpression" ||
          callback.body.consequent.type === "ObjectExpression" ||
          callback.body.alternate.type === "ArrayExpression" ||
          callback.body.alternate.type === "ObjectExpression";

        if (!returnsStructuredBranch) {
          return;
        }

        context.report({
          node: callback.body,
          messageId: "conditionalExpression",
          data: {
            method
          }
        });
      }
    };
  }
};
