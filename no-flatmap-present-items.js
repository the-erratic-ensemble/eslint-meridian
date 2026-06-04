function isFunctionNode(node) {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression" ||
    node?.type === "FunctionDeclaration"
  );
}

function isFlatMapCall(node) {
  return (
    node?.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "flatMap"
  );
}

function isEmptyArrayExpression(node) {
  return node?.type === "ArrayExpression" && node.elements.length === 0;
}

function isSingleItemArrayExpression(node) {
  return node?.type === "ArrayExpression" && node.elements.length === 1 && node.elements[0] !== null;
}

function isPresentItemsConditional(node) {
  if (node?.type !== "ConditionalExpression") {
    return false;
  }

  const consequentIsSingleItem = isSingleItemArrayExpression(node.consequent);
  const alternateIsSingleItem = isSingleItemArrayExpression(node.alternate);
  const consequentIsEmpty = isEmptyArrayExpression(node.consequent);
  const alternateIsEmpty = isEmptyArrayExpression(node.alternate);

  return (consequentIsSingleItem && alternateIsEmpty) || (alternateIsSingleItem && consequentIsEmpty);
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      flatMapPresentItems:
        "Do not use flatMap as a compact present-items filter with `[item]` and `[]` branches. Use staged accumulation or a loop."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (!isFlatMapCall(node)) {
          return;
        }

        const callback = node.arguments.find(isFunctionNode);
        if (!callback || !isPresentItemsConditional(callback.body)) {
          return;
        }

        context.report({
          node: callback.body,
          messageId: "flatMapPresentItems"
        });
      }
    };
  }
};
