function getJsxAttributeName(node) {
  if (!node?.name) return;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  return;
}

function isSimpleObjectExpression(node) {
  if (!node || node.type !== "ObjectExpression") return false;

  return node.properties.every((property) => {
    if (property.type !== "Property") return false;
    const value = property.value;
    return value.type === "Literal" || value.type === "Identifier" || value.type === "MemberExpression";
  });
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage inline object literals in JSX props"
    },
    schema: [
      {
        type: "object",
        properties: {
          propNames: {
            type: "array",
            items: { type: "string" }
          },
          allowSimpleObjects: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noInlineObject:
        "Do not inline object literals in '{{propName}}'. Extract a named constant or helper to keep JSX readable."
    }
  },

  create(context) {
    const options = {
      propNames: [],
      allowSimpleObjects: false,
      ...context.options[0]
    };

    return {
      JSXAttribute(node) {
        const propertyName = getJsxAttributeName(node);
        if (!propertyName) return;
        if (options.propNames.length > 0 && !options.propNames.includes(propertyName)) return;

        if (!node.value || node.value.type !== "JSXExpressionContainer") return;
        const expression = node.value.expression;
        if (!expression || expression.type !== "ObjectExpression") return;

        if (options.allowSimpleObjects && isSimpleObjectExpression(expression)) {
          return;
        }

        context.report({
          node,
          messageId: "noInlineObject",
          data: { propName: propertyName }
        });
      }
    };
  }
};
