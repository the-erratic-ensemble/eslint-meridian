const DOC_HINT = " See docs/rules/prefer-classname-helper-module.md.";

function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visitor);
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

function getJsxAttributeName(node) {
  if (!node?.name) return;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  return;
}

function hasConditionalExpression(node) {
  let found = false;

  walk(node, (child) => {
    if (found) return;
    if (child.type === "ConditionalExpression" || child.type === "LogicalExpression") {
      found = true;
    }
  });

  return found;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer extracting complex className expressions into named helpers"
    },
    schema: [
      {
        type: "object",
        properties: {
          propNames: {
            type: "array",
            items: { type: "string" }
          },
          classHelperNames: {
            type: "array",
            items: { type: "string" }
          },
          maxHelperArgs: { type: "integer", minimum: 1 },
          maxTemplateExpressions: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      extractClassnameHelper: `Class expression in '{{propName}}' is complex. Extract it to a named helper/module constant before JSX.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      propNames: ["className"],
      classHelperNames: ["clsx", "cx", "cn", "classNames"],
      maxHelperArgs: 3,
      maxTemplateExpressions: 2,
      ...context.options[0]
    };

    return {
      JSXAttribute(node) {
        const propertyName = getJsxAttributeName(node);
        if (!propertyName || !options.propNames.includes(propertyName)) return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;

        const expression = node.value.expression;

        if (expression.type === "TemplateLiteral" && expression.expressions.length > options.maxTemplateExpressions) {
          context.report({ node, messageId: "extractClassnameHelper", data: { propName: propertyName } });
          return;
        }

        if (
          expression.type === "CallExpression" &&
          expression.callee.type === "Identifier" &&
          options.classHelperNames.includes(expression.callee.name) &&
          (expression.arguments.length > options.maxHelperArgs || hasConditionalExpression(expression))
        ) {
          context.report({ node, messageId: "extractClassnameHelper", data: { propName: propertyName } });
        }
      }
    };
  }
};
