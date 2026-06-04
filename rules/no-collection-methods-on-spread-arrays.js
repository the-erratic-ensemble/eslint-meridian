const DEFAULT_METHODS = [
  "filter",
  "map",
  "flatMap",
  "reduce",
  "slice",
  "sort",
  "toSorted",
  "toSpliced",
  "toReversed",
  "find",
  "some",
  "every",
  "join"
];

/**
 * Normalize optional-chain wrappers so the rule can treat spread-array
 * post-processing the same way whether or not optional chaining is present in
 * the wider expression.
 *
 * @param {import("estree").Node | null | undefined} node
 * @returns {import("estree").Node | null | undefined}
 */
function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function isTrackedPipelineCall(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    methods.includes(expression.callee.property.name)
  );
}

function isPureSpreadArray(node) {
  return (
    node?.type === "ArrayExpression" &&
    node.elements.length > 0 &&
    node.elements.every((element) => element?.type === "SpreadElement")
  );
}

function getImmediatePostProcessCall(node, methods) {
  if (
    node?.parent?.type !== "MemberExpression" ||
    node.parent.object !== node ||
    node.parent.computed ||
    node.parent.property?.type !== "Identifier"
  ) {
    return null;
  }

  const callExpression = node.parent.parent;
  if (
    callExpression?.type !== "CallExpression" ||
    callExpression.callee !== node.parent ||
    !methods.includes(node.parent.property.name)
  ) {
    return null;
  }

  return callExpression;
}

function collectTrackedMethodNames(node, methods) {
  const names = [];
  let current = node;

  while (isTrackedPipelineCall(current, methods)) {
    const expression = unwrapExpression(current);
    names.push(expression.callee.property.name);
    current =
      expression.parent?.type === "MemberExpression" && expression.parent.object === expression
        ? expression.parent.parent
        : null;
  }

  return names;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow spread-built array literals that immediately feed inline collection-method pipelines"
    },
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
      collectionMethodsOnSpreadArray:
        "Do not build spread arrays inline just to run collection methods ({{chain}}). Stage the spread result in a named local first."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      ArrayExpression(node) {
        if (!isPureSpreadArray(node)) {
          return;
        }

        const firstPostProcessCall = getImmediatePostProcessCall(node, options.methods);
        if (!firstPostProcessCall) {
          return;
        }

        context.report({
          node,
          messageId: "collectionMethodsOnSpreadArray",
          data: {
            chain: collectTrackedMethodNames(firstPostProcessCall, options.methods).join(" -> ")
          }
        });
      }
    };
  }
};
