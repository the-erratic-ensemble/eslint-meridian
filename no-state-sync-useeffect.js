const DOC_HINT = " See docs/rules/no-state-sync-useeffect.md.";

function isFunctionNode(node) {
  return node && (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression");
}

function getEffectHookName(callNode) {
  if (!callNode || callNode.type !== "CallExpression") return;

  if (callNode.callee.type === "Identifier") {
    return callNode.callee.name;
  }

  if (
    callNode.callee.type === "MemberExpression" &&
    !callNode.callee.computed &&
    callNode.callee.property.type === "Identifier"
  ) {
    return callNode.callee.property.name;
  }

  return;
}

function getRootIdentifierName(node) {
  if (!node) return;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") return getRootIdentifierName(node.object);
  if (node.type === "ChainExpression") return getRootIdentifierName(node.expression);
  return;
}

function getDependencyNames(node) {
  if (!node || node.type !== "ArrayExpression") return new Set();
  const names = new Set();

  for (const element of node.elements) {
    const rootName = getRootIdentifierName(element);
    if (rootName) names.add(rootName);
  }

  return names;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn on trivial useEffect state sync patterns"
    },
    schema: [
      {
        type: "object",
        properties: {
          hooks: {
            type: "array",
            items: { type: "string" }
          },
          setterPattern: { type: "string" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidSyncEffect: `This useEffect appears to mirror '{{source}}' into '{{setter}}'. Prefer deriving state directly or using memoized values.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      hooks: ["useEffect", "useLayoutEffect"],
      setterPattern: "^set[A-Z]",
      ...context.options[0]
    };

    const setterRegex = new RegExp(options.setterPattern);

    return {
      CallExpression(node) {
        const hookName = getEffectHookName(node);
        if (!hookName || !options.hooks.includes(hookName)) return;

        const callback = node.arguments[0];
        const dependenciesNode = node.arguments[1];

        if (!isFunctionNode(callback) || callback.body.type !== "BlockStatement") return;
        if (callback.body.body.length !== 1) return;

        const statement = callback.body.body[0];
        if (statement.type !== "ExpressionStatement") return;
        const expression = statement.expression;
        if (expression.type !== "CallExpression") return;
        if (expression.callee.type !== "Identifier") return;
        if (!setterRegex.test(expression.callee.name)) return;
        if (expression.arguments.length !== 1) return;

        const sourceName = getRootIdentifierName(expression.arguments[0]);
        if (!sourceName) return;

        const dependencyNames = getDependencyNames(dependenciesNode);
        if (!dependencyNames.has(sourceName)) return;

        context.report({
          node: statement,
          messageId: "avoidSyncEffect",
          data: {
            source: sourceName,
            setter: expression.callee.name
          }
        });
      }
    };
  }
};
