const DEFAULT_METHODS = ["map", "filter", "reduce", "flatMap", "find", "some", "every"];

function isFunctionNode(node) {
  return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}

function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function isSimplePassthroughExpression(node) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "Identifier" ||
    expression?.type === "MemberExpression" ||
    expression?.type === "ThisExpression"
  );
}

function isTrackedCollectionMethodCall(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    methods.includes(expression.callee.property.name) &&
    expression.arguments.some(isFunctionNode)
  );
}

function isCollectionBranch(node, methods) {
  return isTrackedCollectionMethodCall(node, methods) || isSimplePassthroughExpression(node);
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
      collectionMethodInTernary:
        "Do not hide collection method work inside ternary branches. Stage the collection result first or expand the control flow."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      ConditionalExpression(node) {
        if (node.parent?.type === "JSXExpressionContainer") {
          return;
        }

        const consequentIsCollectionMethod = isTrackedCollectionMethodCall(node.consequent, options.methods);
        const alternateIsCollectionMethod = isTrackedCollectionMethodCall(node.alternate, options.methods);
        if (!consequentIsCollectionMethod && !alternateIsCollectionMethod) {
          return;
        }

        if (
          !isCollectionBranch(node.consequent, options.methods) ||
          !isCollectionBranch(node.alternate, options.methods)
        ) {
          return;
        }

        context.report({
          node,
          messageId: "collectionMethodInTernary"
        });
      }
    };
  }
};
