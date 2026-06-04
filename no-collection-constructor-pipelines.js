const DEFAULT_METHODS = ["map", "filter", "flatMap"];
const COLLECTION_CONSTRUCTORS = new Set(["Set", "Map"]);

function unwrapExpression(node) {
  return node?.type === "ChainExpression" ? node.expression : node;
}

function constructorName(node) {
  return node?.callee?.type === "Identifier" ? node.callee.name : null;
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

function walk(node, visitor) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (typeof node.type === "string") {
    visitor(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, visitor);
      }
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

function trackedPipelineChainLength(node, methods) {
  const expression = unwrapExpression(node);

  if (!isTrackedPipelineCall(expression, methods)) {
    return 0;
  }

  return 1 + trackedPipelineChainLength(expression.callee.object, methods);
}

function hasTrackedPipeline(node, methods) {
  let found = false;

  walk(node, (child) => {
    if (!found && isTrackedPipelineCall(child, methods)) {
      found = true;
    }
  });

  return found;
}

function hasConditionalPipeline(node, methods) {
  let found = false;

  walk(node, (child) => {
    if (found) {
      return;
    }

    if (
      (child.type === "ConditionalExpression" ||
        (child.type === "LogicalExpression" && (child.operator === "??" || child.operator === "||"))) &&
      hasTrackedPipeline(child, methods)
    ) {
      found = true;
    }
  });

  return found;
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
      collectionConstructorPipeline:
        "Do not construct {{type}} instances from inline collection-shaping pipelines. Stage the input first or use explicit accumulation."
    }
  },

  create(context) {
    const options = {
      methods: DEFAULT_METHODS,
      ...(context.options[0] || {})
    };

    return {
      NewExpression(node) {
        const type = constructorName(node);
        if (!COLLECTION_CONSTRUCTORS.has(type ?? "")) {
          return;
        }

        const [firstArgument] = node.arguments;
        if (!firstArgument || !hasTrackedPipeline(firstArgument, options.methods)) {
          return;
        }

        const pipelineCount = trackedPipelineChainLength(firstArgument, options.methods);
        const shouldReport = pipelineCount > 1 || hasConditionalPipeline(firstArgument, options.methods);
        if (!shouldReport) {
          return;
        }

        context.report({
          node,
          messageId: "collectionConstructorPipeline",
          data: { type }
        });
      }
    };
  }
};
