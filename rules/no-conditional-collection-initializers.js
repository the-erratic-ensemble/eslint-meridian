const DEFAULT_METHODS = ["map", "filter", "flatMap"];
const COLLECTION_CONSTRUCTORS = new Set(["Set", "Map"]);

function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function isIdentifierLike(node) {
  const expression = unwrapExpression(node);
  return expression?.type === "Identifier" || expression?.type === "MemberExpression";
}

function isCollectionMethodCall(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    methods.includes(expression.callee.property.name)
  );
}

function isCollectionConstructor(node) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "NewExpression" &&
    expression.callee?.type === "Identifier" &&
    COLLECTION_CONSTRUCTORS.has(expression.callee.name)
  );
}

function isArrayLikeLiteral(node) {
  const expression = unwrapExpression(node);
  return expression?.type === "ArrayExpression";
}

function collectionRootText(node, sourceCode) {
  const expression = unwrapExpression(node);

  if (expression?.type === "CallExpression" && expression.callee?.type === "MemberExpression") {
    return sourceCode.getText(expression.callee.object);
  }

  if (isIdentifierLike(expression)) {
    return sourceCode.getText(expression);
  }

  return null;
}

function isArrayIsArrayCall(node) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    expression.callee.object?.type === "Identifier" &&
    expression.callee.object.name === "Array" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    expression.callee.property.name === "isArray"
  );
}

function isGuardedCollectionReference(node, test, counterpart, sourceCode) {
  if (!isIdentifierLike(node)) {
    return false;
  }

  const nodeText = collectionRootText(node, sourceCode);
  const counterpartRoot = collectionRootText(counterpart, sourceCode);
  if (nodeText && counterpartRoot && nodeText === counterpartRoot) {
    return true;
  }

  if (!isArrayIsArrayCall(test)) {
    return false;
  }

  const [firstArgument] = test.arguments;
  return Boolean(firstArgument && nodeText && sourceCode.getText(firstArgument) === nodeText);
}

function isCollectionCandidate(node, counterpart, test, methods, sourceCode) {
  return (
    isArrayLikeLiteral(node) ||
    isCollectionConstructor(node) ||
    isCollectionMethodCall(node, methods) ||
    isGuardedCollectionReference(node, test, counterpart, sourceCode)
  );
}

function isDerivedCollection(node, methods) {
  return isArrayLikeLiteral(node) || isCollectionConstructor(node) || isCollectionMethodCall(node, methods);
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
      conditionalCollectionInitializer:
        "Do not initialize collections with ternary expressions. Stage the collection first or expand the control flow."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      VariableDeclarator(node) {
        if (node.init?.type !== "ConditionalExpression") {
          return;
        }

        const { consequent, alternate, test } = node.init;
        const consequentIsDerived = isDerivedCollection(consequent, options.methods);
        const alternateIsDerived = isDerivedCollection(alternate, options.methods);

        if (!consequentIsDerived && !alternateIsDerived) {
          return;
        }

        if (
          !isCollectionCandidate(consequent, alternate, test, options.methods, sourceCode) ||
          !isCollectionCandidate(alternate, consequent, test, options.methods, sourceCode)
        ) {
          return;
        }

        context.report({
          node: node.init,
          messageId: "conditionalCollectionInitializer"
        });
      }
    };
  }
};
