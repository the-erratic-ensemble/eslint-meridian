function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function isFlatMapCall(node) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    expression.callee.property.name === "flatMap"
  );
}

function constructorName(node) {
  return node?.callee?.type === "Identifier" ? node.callee.name : null;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      setOrMapFromFlatMap:
        "Do not construct {{type}} instances directly from flatMap expressions. Stage the entries first or use explicit accumulation."
    }
  },

  create(context) {
    return {
      NewExpression(node) {
        const type = constructorName(node);
        if (type !== "Set" && type !== "Map") {
          return;
        }

        const [firstArgument] = node.arguments;
        if (!isFlatMapCall(firstArgument)) {
          return;
        }

        context.report({
          node,
          messageId: "setOrMapFromFlatMap",
          data: { type }
        });
      }
    };
  }
};
