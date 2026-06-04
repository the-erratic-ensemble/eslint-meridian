const DEFAULT_METHODS = ["map", "filter", "flatMap", "reduce", "toSorted", "toSpliced", "toReversed"];
const DEFAULT_POST_PROCESS_METHODS = ["slice", "map", "filter", "flatMap", "reduce", "join", "find", "some", "every"];

/**
 * Normalize optional chain wrappers so the rule can treat `items?.filter(...)`
 * and `items.filter(...)` as the same pipeline shape.
 *
 * @param {import("estree").Node | null | undefined} node
 * @returns {import("estree").Node | null | undefined}
 */
function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

/**
 * Check whether a node is one tracked collection-method call.
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
 * Count chained tracked method calls from the outside in, so
 * `items.filter(...).map(...)` returns `2`.
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
 * Detect whether the array literal is immediately post-processed with a
 * tracked method such as `.slice(...)`.
 *
 * @param {import("estree").ArrayExpression} node
 * @param {readonly string[]} methods
 * @returns {string | null}
 */
function getPostProcessMethodName(node, methods) {
  if (
    node.parent?.type !== "MemberExpression" ||
    node.parent.object !== node ||
    node.parent.computed ||
    node.parent.property?.type !== "Identifier"
  ) {
    return null;
  }

  const grandparent = node.parent.parent;
  if (
    grandparent?.type !== "CallExpression" ||
    grandparent.callee !== node.parent ||
    !methods.includes(node.parent.property.name)
  ) {
    return null;
  }

  return node.parent.property.name;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline array literals that combine spread-hidden collection pipelines with additional inline processing"
    },
    schema: [
      {
        type: "object",
        properties: {
          methods: {
            type: "array",
            items: { type: "string" }
          },
          postProcessMethods: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      inlineSpreadCollectionPipeline:
        "Do not combine inline array assembly with spread-driven collection pipeline work{{detail}}. Stage the transformed items or the final array in a named local first."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      postProcessMethods: DEFAULT_POST_PROCESS_METHODS,
      ...(context.options[0] || {})
    };

    return {
      ArrayExpression(node) {
        const spreadElements = node.elements.filter((element) => element?.type === "SpreadElement");
        if (spreadElements.length === 0) {
          return;
        }

        const regularElementCount = node.elements.filter(
          (element) => element && element.type !== "SpreadElement"
        ).length;
        if (regularElementCount === 0) {
          return;
        }

        const maxSpreadPipelineLength = spreadElements.reduce((maxLength, spreadElement) => {
          return Math.max(maxLength, trackedPipelineChainLength(spreadElement.argument, options.methods));
        }, 0);
        if (maxSpreadPipelineLength === 0) {
          return;
        }

        const postProcessMethod = getPostProcessMethodName(node, options.postProcessMethods);
        const hasMultiStepSpreadPipeline = maxSpreadPipelineLength > 1;

        if (!postProcessMethod && !hasMultiStepSpreadPipeline) {
          return;
        }

        const detail = postProcessMethod ? ` like ${postProcessMethod}()` : " across multiple collection steps";

        context.report({
          node,
          messageId: "inlineSpreadCollectionPipeline",
          data: { detail }
        });
      }
    };
  }
};
