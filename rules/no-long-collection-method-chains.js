const DEFAULT_METHODS = [
  "filter",
  "map",
  "flatMap",
  "slice",
  "sort",
  "toSorted",
  "toSpliced",
  "toReversed",
  "reduce",
  "find",
  "some",
  "every"
];

/**
 * Normalize optional-chain wrappers so chain counting treats `items?.filter()`
 * the same as `items.filter()`.
 *
 * @param {import("estree").Node | null | undefined} node
 * @returns {import("estree").Node | null | undefined}
 */
function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

/**
 * Check whether the node is one tracked collection-method call in the pipeline.
 *
 * @param {import("estree").Node | null | undefined} node
 * @param {readonly string[]} methods
 * @returns {boolean}
 */
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

/**
 * Count the tracked calls on the main callee-object chain only. This avoids
 * accidentally counting nested callback work as part of the outer pipeline.
 *
 * @param {import("estree").Node | null | undefined} node
 * @param {readonly string[]} methods
 * @returns {number}
 */
function trackedPipelineChainLength(node, methods) {
  const expression = unwrapExpression(node);

  if (!isTrackedPipelineCall(expression, methods)) {
    return 0;
  }

  return 1 + trackedPipelineChainLength(expression.callee.object, methods);
}

/**
 * Return tracked method names in execution order, for example
 * `items.filter(...).slice(0, 3).map(...)` -> `["filter", "slice", "map"]`.
 *
 * @param {import("estree").Node | null | undefined} node
 * @param {readonly string[]} methods
 * @returns {string[]}
 */
function trackedPipelineMethodNames(node, methods) {
  const expression = unwrapExpression(node);

  if (!isTrackedPipelineCall(expression, methods)) {
    return [];
  }

  return [...trackedPipelineMethodNames(expression.callee.object, methods), expression.callee.property.name];
}

function isNestedInsideTrackedPipeline(node, methods) {
  const parentMemberExpression = node?.parent;
  const parentCallExpression = parentMemberExpression?.parent;

  return Boolean(
    parentMemberExpression?.type === "MemberExpression" &&
    parentMemberExpression.object === node &&
    parentCallExpression?.type === "CallExpression" &&
    parentCallExpression.callee === parentMemberExpression &&
    isTrackedPipelineCall(parentCallExpression, methods)
  );
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow overly long inline collection-method chains"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxChainLength: { type: "integer", minimum: 1 },
          methods: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      longCollectionMethodChain:
        "This collection pipeline chains {{length}} tracked methods ({{chain}}, max {{max}}). Stage an intermediate local before continuing the pipeline."
    }
  },

  create(context) {
    const options = {
      maxChainLength: 2,
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      CallExpression(node) {
        if (!isTrackedPipelineCall(node, options.methods)) {
          return;
        }

        if (isNestedInsideTrackedPipeline(node, options.methods)) {
          return;
        }

        const chainLength = trackedPipelineChainLength(node, options.methods);
        if (chainLength <= options.maxChainLength) {
          return;
        }

        context.report({
          node,
          messageId: "longCollectionMethodChain",
          data: {
            length: String(chainLength),
            chain: trackedPipelineMethodNames(node, options.methods).join(" -> "),
            max: String(options.maxChainLength)
          }
        });
      }
    };
  }
};
