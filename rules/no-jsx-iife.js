function isFunctionNode(node) {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression"
  );
}

function isIifeCall(node) {
  if (!node) return false;

  if (node.type === "CallExpression") {
    return isFunctionNode(node.callee);
  }

  if (node.type === "ChainExpression") {
    return isIifeCall(node.expression);
  }

  return false;
}

function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, visitor);
      }
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow immediately-invoked function expressions inside JSX",
    },
    schema: [],
    messages: {
      noJsxIife:
        "Do not use IIFEs inside JSX. Stage the value before JSX or extract a component/helper.",
    },
  },

  create(context) {
    const reportedNodes = new Set();

    return {
      JSXExpressionContainer(node) {
        walk(node.expression, (child) => {
          if (!isIifeCall(child)) return;

          const reportKey =
            child.range?.join(":") ??
            `${child.loc?.start.line}:${child.loc?.start.column}`;
          if (reportedNodes.has(reportKey)) return;

          reportedNodes.add(reportKey);

          context.report({
            node: child,
            messageId: "noJsxIife",
          });
        });
      },
    };
  },
};
