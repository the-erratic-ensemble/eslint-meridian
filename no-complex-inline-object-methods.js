const FUNCTION_NODE_TYPES = new Set(["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration"]);
const CONTROL_FLOW_TYPES = new Set([
  "IfStatement",
  "SwitchStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "TryStatement",
  "ConditionalExpression"
]);
const LOGICAL_OPERATORS = new Set(["&&", "||"]);

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

function isFunctionNode(node) {
  return Boolean(node && FUNCTION_NODE_TYPES.has(node.type));
}

function getPropertyName(node) {
  if (!node?.key) {
    return "property";
  }

  if (node.key.type === "Identifier") {
    return node.key.name;
  }

  if (node.key.type === "Literal" && typeof node.key.value === "string") {
    return node.key.value;
  }

  return "property";
}

function getInlineMethodFunction(node) {
  if (!node || node.type !== "Property" || node.parent?.type !== "ObjectExpression") {
    return null;
  }

  if (node.method && node.value?.type === "FunctionExpression") {
    return node.value;
  }

  if (node.value?.type === "ArrowFunctionExpression" || node.value?.type === "FunctionExpression") {
    return node.value;
  }

  return null;
}

function countComplexitySignals(functionNode, options) {
  let count = 0;

  walk(functionNode.body, (child) => {
    if (CONTROL_FLOW_TYPES.has(child.type)) {
      count += 1;
      return;
    }

    if (
      options.countLogicalExpressions &&
      child.type === "LogicalExpression" &&
      LOGICAL_OPERATORS.has(child.operator)
    ) {
      count += 1;
      return;
    }

    if (options.countNestedFunctions && child !== functionNode && isFunctionNode(child)) {
      count += 1;
    }
  });

  return count;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when inline object literal methods become structurally complex"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxComplexitySignals: { type: "integer", minimum: 0 },
          countLogicalExpressions: { type: "boolean" },
          countNestedFunctions: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooComplex:
        "Inline object method '{{name}}' is too complex ({{count}} complexity signals, max {{max}}). Extract a named helper or simplify the branching inside the object literal."
    }
  },

  create(context) {
    const options = {
      maxComplexitySignals: 2,
      countLogicalExpressions: true,
      countNestedFunctions: true,
      ...(context.options[0] || {})
    };

    return {
      Property(node) {
        const functionNode = getInlineMethodFunction(node);
        if (!functionNode) {
          return;
        }

        const complexitySignals = countComplexitySignals(functionNode, options);
        if (complexitySignals <= options.maxComplexitySignals) {
          return;
        }

        context.report({
          node,
          messageId: "tooComplex",
          data: {
            name: getPropertyName(node),
            count: String(complexitySignals),
            max: String(options.maxComplexitySignals)
          }
        });
      }
    };
  }
};
