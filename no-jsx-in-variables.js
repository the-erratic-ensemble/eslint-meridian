function containsJsxValue(node) {
  if (!node) return false;

  switch (node.type) {
    case "JSXElement":
    case "JSXFragment": {
      return true;
    }

    case "ChainExpression":
    case "ParenthesizedExpression":
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
    case "TSTypeAssertion": {
      return containsJsxValue(node.expression);
    }

    case "ConditionalExpression": {
      return containsJsxValue(node.consequent) || containsJsxValue(node.alternate);
    }

    case "LogicalExpression": {
      return containsJsxValue(node.left) || containsJsxValue(node.right);
    }

    case "SequenceExpression": {
      return node.expressions.some((expression) => containsJsxValue(expression));
    }

    default: {
      return false;
    }
  }
}

function objectStoresDirectJsxValues(node) {
  if (!node || node.type !== "ObjectExpression") return false;

  const properties = node.properties.filter((property) => property?.type === "Property");
  if (properties.length === 0 || properties.length !== node.properties.length) return false;

  return properties.every((property) => containsJsxValue(property.value));
}

function arrayStoresDirectJsxValues(node) {
  if (!node || node.type !== "ArrayExpression") return false;

  const elements = node.elements.filter(Boolean);
  if (elements.length === 0 || elements.length !== node.elements.length) return false;

  return elements.every((element) => containsJsxValue(element));
}

function storesJsxValue(node) {
  return containsJsxValue(node) || objectStoresDirectJsxValues(node) || arrayStoresDirectJsxValues(node);
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow assigning JSX to variables"
    },
    schema: [
      {
        type: "object",
        properties: {
          allowNamePattern: { type: "string" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noJsxVariable: "Do not assign JSX to variable {{name}}. Extract a component or keep the JSX where it is rendered."
    }
  },

  create(context) {
    const options = {
      allowNamePattern: null,
      ...(context.options[0] || {})
    };

    const allowRegex = options.allowNamePattern ? new RegExp(options.allowNamePattern) : null;

    return {
      VariableDeclarator(node) {
        if (!storesJsxValue(node.init)) return;
        if (node.id?.type !== "Identifier") return;

        if (allowRegex && allowRegex.test(node.id.name)) return;

        context.report({
          node: node.init,
          messageId: "noJsxVariable",
          data: {
            name: node.id.name
          }
        });
      }
    };
  }
};
