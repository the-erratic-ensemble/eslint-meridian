import { getNormalizedExpressionKey } from "./eslint-local-rules-shared.js";

function isTrackedCollectionMethodCall(node, methods) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property?.type === "Identifier" &&
    methods.includes(node.callee.property.name)
  );
}

function flattenFallbackChain(node, operators, values = []) {
  if (node?.type === "LogicalExpression" && operators.includes(node.operator)) {
    flattenFallbackChain(node.left, operators, values);
    flattenFallbackChain(node.right, operators, values);
    return values;
  }

  values.push(node);
  return values;
}

function sameReceiverKey(node, methods) {
  if (!isTrackedCollectionMethodCall(node, methods)) {
    return null;
  }

  return getNormalizedExpressionKey(node.callee.object);
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
          },
          operators: {
            type: "array",
            items: {
              type: "string",
              enum: ["??", "||"]
            }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      repeatedCollectionMethodFallback:
        "Avoid chaining repeated collection-method calls on the same collection in one fallback expression. Pull the selection or transform into a named helper or explicit staged steps."
    }
  },

  create(context) {
    const options = {
      methods: ["find", "map", "filter", "reduce", "flatMap", "some", "every"],
      operators: ["??", "||"],
      ...(context.options[0] || {})
    };

    return {
      LogicalExpression(node) {
        if (!options.operators.includes(node.operator)) {
          return;
        }

        if (node.parent?.type === "LogicalExpression" && options.operators.includes(node.parent.operator)) {
          return;
        }

        const operands = flattenFallbackChain(node, options.operators);
        const seenMethodReceivers = new Set();

        for (const operand of operands) {
          const receiverKey = sameReceiverKey(operand, options.methods);
          if (receiverKey === null) {
            continue;
          }

          if (seenMethodReceivers.has(receiverKey)) {
            context.report({
              node,
              messageId: "repeatedCollectionMethodFallback"
            });
            return;
          }

          seenMethodReceivers.add(receiverKey);
        }
      }
    };
  }
};
