const JSX_NODE_TYPES = new Set([
  "JSXAttribute",
  "JSXElement",
  "JSXExpressionContainer",
  "JSXFragment",
  "JSXSpreadAttribute"
]);

const FUNCTION_BOUNDARY_TYPES = new Set(["ArrowFunctionExpression", "FunctionDeclaration", "FunctionExpression"]);

function getScopedAncestors(node) {
  const ancestors = [];
  let current = node?.parent ?? null;

  while (current) {
    if (FUNCTION_BOUNDARY_TYPES.has(current.type)) {
      break;
    }

    ancestors.push(current);
    current = current.parent ?? null;
  }

  return ancestors;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow nested ternary expressions directly in JSX render paths"
    },
    schema: [],
    messages: {
      avoidNestedTernaryInJsx:
        "Do not nest ternary expressions directly in JSX render paths. Extract the decision before the JSX and reference the prepared value."
    }
  },

  create(context) {
    return {
      ConditionalExpression(node) {
        const ancestors = getScopedAncestors(node);

        if (!ancestors.some((ancestor) => JSX_NODE_TYPES.has(ancestor.type))) {
          return;
        }

        if (!ancestors.some((ancestor) => ancestor.type === "ConditionalExpression")) {
          return;
        }

        context.report({
          node,
          messageId: "avoidNestedTernaryInJsx"
        });
      }
    };
  }
};
