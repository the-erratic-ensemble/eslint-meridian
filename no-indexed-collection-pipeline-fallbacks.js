const DEFAULT_METHODS = ["filter", "map", "flatMap", "slice", "sort", "toSorted"];

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

function hasTrackedPipeline(node, methods) {
  const expression = unwrapExpression(node);

  if (!expression || typeof expression !== "object") {
    return false;
  }

  if (isTrackedPipelineCall(expression, methods)) {
    return true;
  }

  if (expression.type === "MemberExpression") {
    return hasTrackedPipeline(expression.object, methods);
  }

  if (expression.type === "CallExpression") {
    return hasTrackedPipeline(expression.callee, methods);
  }

  return false;
}

function isZeroIndexProperty(node) {
  return node?.type === "Literal" && (node.value === 0 || node.value === "0");
}

function isIndexedCollectionPipeline(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "MemberExpression" &&
    expression.computed &&
    isZeroIndexProperty(expression.property) &&
    hasTrackedPipeline(expression.object, methods)
  );
}

function isAtZeroCollectionPipeline(node, methods) {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "CallExpression" &&
    expression.callee?.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.property?.type === "Identifier" &&
    expression.callee.property.name === "at" &&
    expression.arguments.length > 0 &&
    isZeroIndexProperty(expression.arguments[0]) &&
    hasTrackedPipeline(expression.callee.object, methods)
  );
}

function isFirstSlotArrayPattern(node) {
  return node?.type === "ArrayPattern" && node.elements.length > 0 && node.elements[0] !== null;
}

function isDirectFirstItemSelectionParent(node, methods) {
  return isIndexedCollectionPipeline(node, methods) || isAtZeroCollectionPipeline(node, methods);
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
      indexedCollectionPipelineFallback:
        "Do not hide first-item selection inside collection-shaping pipelines. Stage the collection result first or pull the selection into a named helper."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      MemberExpression(node) {
        if (!isIndexedCollectionPipeline(node, options.methods)) {
          return;
        }

        if (isDirectFirstItemSelectionParent(node.parent, options.methods)) {
          return;
        }

        context.report({
          node,
          messageId: "indexedCollectionPipelineFallback"
        });
      },

      CallExpression(node) {
        if (!isAtZeroCollectionPipeline(node, options.methods)) {
          return;
        }

        context.report({
          node,
          messageId: "indexedCollectionPipelineFallback"
        });
      },

      VariableDeclarator(node) {
        if (!isFirstSlotArrayPattern(node.id) || !hasTrackedPipeline(node.init, options.methods)) {
          return;
        }

        context.report({
          node,
          messageId: "indexedCollectionPipelineFallback"
        });
      },

      AssignmentExpression(node) {
        if (!isFirstSlotArrayPattern(node.left) || !hasTrackedPipeline(node.right, options.methods)) {
          return;
        }

        context.report({
          node,
          messageId: "indexedCollectionPipelineFallback"
        });
      }
    };
  }
};
