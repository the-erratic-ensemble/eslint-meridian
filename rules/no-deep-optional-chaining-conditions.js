const DOC_HINT = " See docs/rules/no-deep-optional-chaining-conditions.md.";

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

function getOptionalDepth(node) {
  if (!node) return 0;

  if (node.type === "ChainExpression") {
    return getOptionalDepth(node.expression);
  }

  if (node.type === "MemberExpression") {
    return (node.optional ? 1 : 0) + getOptionalDepth(node.object);
  }

  if (node.type === "CallExpression") {
    return (node.optional ? 1 : 0) + getOptionalDepth(node.callee);
  }

  return 0;
}

function getMaxOptionalDepthInTest(testNode) {
  let maxDepth = 0;

  walk(testNode, (child) => {
    if (child.type === "ChainExpression" || child.type === "MemberExpression" || child.type === "CallExpression") {
      maxDepth = Math.max(maxDepth, getOptionalDepth(child));
    }
  });

  return maxDepth;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage deep optional chaining in condition checks"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxOptionalDepth: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      deepOptionalChain: `Condition uses optional chaining depth {{depth}} (max {{max}}). Extract a guard/helper for readability.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      maxOptionalDepth: 3,
      ...context.options[0]
    };

    function reportIfTooDeep(node, test) {
      if (!test) return;
      const depth = getMaxOptionalDepthInTest(test);
      if (depth <= options.maxOptionalDepth) return;

      context.report({
        node,
        messageId: "deepOptionalChain",
        data: {
          depth: String(depth),
          max: String(options.maxOptionalDepth)
        }
      });
    }

    return {
      IfStatement(node) {
        reportIfTooDeep(node.test, node.test);
      },
      WhileStatement(node) {
        reportIfTooDeep(node.test, node.test);
      },
      DoWhileStatement(node) {
        reportIfTooDeep(node.test, node.test);
      },
      ForStatement(node) {
        reportIfTooDeep(node.test ?? node, node.test);
      },
      ConditionalExpression(node) {
        reportIfTooDeep(node.test, node.test);
      }
    };
  }
};
