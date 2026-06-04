const FUNCTION_NODE_TYPES = new Set(["ArrowFunctionExpression", "FunctionDeclaration", "FunctionExpression"]);
const DEFAULT_TRACKED_ANCESTOR_BLOCKS = ["try", "catch", "finally"];

function isFunctionNode(node) {
  return Boolean(node && FUNCTION_NODE_TYPES.has(node.type));
}

/**
 * Identify which section of the enclosing try statement currently owns the
 * descendant node. This lets the rule tell operators whether the nested try is
 * hidden inside the outer `try`, `catch`, or `finally` path.
 *
 * @param {import("estree").Node | null | undefined} childNode
 * @param {import("estree").TryStatement} tryNode
 * @returns {"try" | "catch" | "finally" | null}
 */
function getTryContainmentKind(childNode, tryNode) {
  if (tryNode.block === childNode) {
    return "try";
  }

  if (tryNode.handler === childNode) {
    return "catch";
  }

  if (tryNode.finalizer === childNode) {
    return "finally";
  }

  return null;
}

/**
 * Count tracked try ancestors without crossing a function boundary. Nested
 * helper functions are treated as their own execution frame so the rule stays
 * focused on same-flow error handling instead of reporting separate callbacks.
 *
 * @param {import("estree").TryStatement} node
 * @param {Set<"try" | "catch" | "finally">} trackedAncestorBlocks
 * @returns {{ depth: number, nearestKind: "try" | "catch" | "finally" | null }}
 */
function getTryDepth(node, trackedAncestorBlocks) {
  let depth = 1;
  let nearestKind = null;
  let current = node;
  let parent = node.parent;

  while (current && parent) {
    if (isFunctionNode(parent)) {
      break;
    }

    if (parent.type === "TryStatement") {
      const containmentKind = getTryContainmentKind(current, parent);

      if (containmentKind && trackedAncestorBlocks.has(containmentKind)) {
        depth += 1;
        nearestKind ??= containmentKind;
      }
    }

    current = parent;
    parent = parent.parent;
  }

  return { depth, nearestKind };
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow nested try blocks within the same execution frame"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: { type: "integer", minimum: 1 },
          trackedAncestorBlocks: {
            type: "array",
            items: {
              type: "string",
              enum: DEFAULT_TRACKED_ANCESTOR_BLOCKS
            },
            minItems: 1,
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      nestedTry:
        "Do not nest try blocks inside {{containerKind}} blocks (depth {{depth}}, max {{maxDepth}}). Extract a helper or separate the error-handling boundary."
    }
  },

  create(context) {
    const options = {
      maxDepth: 1,
      trackedAncestorBlocks: DEFAULT_TRACKED_ANCESTOR_BLOCKS,
      ...(context.options[0] || {})
    };

    const trackedAncestorBlocks = new Set(options.trackedAncestorBlocks);

    return {
      TryStatement(node) {
        const { depth, nearestKind } = getTryDepth(node, trackedAncestorBlocks);

        if (!nearestKind || depth <= options.maxDepth) {
          return;
        }

        context.report({
          node,
          messageId: "nestedTry",
          data: {
            containerKind: nearestKind,
            depth: String(depth),
            maxDepth: String(options.maxDepth)
          }
        });
      }
    };
  }
};
