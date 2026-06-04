import { getNormalizedExpressionKey } from "./eslint-local-rules-shared.js";

const DEFAULT_METHODS = ["find", "map", "filter", "reduce", "flatMap", "some", "every"];
const DEFAULT_OPERATORS = ["??", "||"];

function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function collectFallbackOperands(node, operators, values = []) {
  if (node?.type === "LogicalExpression" && operators.includes(node.operator)) {
    collectFallbackOperands(node.left, operators, values);
    collectFallbackOperands(node.right, operators, values);
    return values;
  }

  values.push(node);
  return values;
}

function isTrackedCollectionMethodCall(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    methods.includes(expression.callee.property.name)
  );
}

function getTrackedReceiver(node, methods) {
  const expression = unwrapExpression(node);

  if (!isTrackedCollectionMethodCall(node, methods)) {
    return null;
  }

  return getNormalizedExpressionKey(expression.callee.object);
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
      inlineCollectionFallback:
        "Avoid inline collection method fallbacks. Stage the collection transform in a local variable before applying fallback."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      operators: DEFAULT_OPERATORS,
      ...context.options[0]
    };

    return {
      LogicalExpression(node) {
        if (!options.operators.includes(node.operator)) {
          return;
        }

        if (node.parent?.type === "LogicalExpression" && options.operators.includes(node.parent.operator)) {
          return;
        }

        const operands = collectFallbackOperands(node, options.operators);
        const collectionOperands = [];
        const receiverKeys = new Set();

        for (const operand of operands) {
          const receiver = getTrackedReceiver(operand, options.methods);
          if (receiver === null) {
            continue;
          }

          collectionOperands.push(operand);
          receiverKeys.add(receiver);
        }

        if (collectionOperands.length === 0) {
          return;
        }

        if (collectionOperands.length > 1 && receiverKeys.size === 1) {
          return;
        }

        context.report({
          node,
          messageId: "inlineCollectionFallback"
        });
      }
    };
  }
};
