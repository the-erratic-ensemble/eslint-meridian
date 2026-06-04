const DOC_HINT = " See docs/rules/no-render-time-date-in-jsx.md.";

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

function isDateConstructor(node) {
  return node?.type === "NewExpression" && node.callee?.type === "Identifier" && node.callee.name === "Date";
}

function isDateStaticCall(node, staticMethods) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    node.callee.object.name === "Date" &&
    node.callee.property?.type === "Identifier" &&
    staticMethods.includes(node.callee.property.name)
  );
}

function containsRenderTimeDate(node, staticMethods) {
  let found = false;

  walk(node, (child) => {
    if (found) return;
    if (isDateConstructor(child) || isDateStaticCall(child, staticMethods)) {
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
      description: "Warn when JSX render output constructs Date values inline"
    },
    schema: [
      {
        type: "object",
        properties: {
          staticMethods: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      renderTimeDateInJsx: `Do not construct Date values inside JSX render output. Pass a prepared value into the component or compute it outside the render expression.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      staticMethods: ["now"],
      ...(context.options[0] || {})
    };

    return {
      JSXExpressionContainer(node) {
        if (!containsRenderTimeDate(node.expression, options.staticMethods)) return;

        context.report({
          node,
          messageId: "renderTimeDateInJsx"
        });
      }
    };
  }
};
