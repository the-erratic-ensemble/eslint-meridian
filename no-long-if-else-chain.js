const FUNCTION_NODE_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

function isRootIf(node) {
  return !(node.parent && node.parent.type === "IfStatement" && node.parent.alternate === node);
}

function getIfChain(node) {
  const chain = [];
  let current = node;

  while (current && current.type === "IfStatement") {
    chain.push(current);
    current = current.alternate && current.alternate.type === "IfStatement" ? current.alternate : null;
  }

  return chain;
}

function countAssignmentsInNode(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  if (FUNCTION_NODE_TYPES.has(node.type)) {
    return 0;
  }

  let count = 0;

  if (node.type === "AssignmentExpression" || node.type === "UpdateExpression" || node.type === "VariableDeclarator") {
    count += 1;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        count += countAssignmentsInNode(child);
      }
      continue;
    }

    if (value && typeof value === "object") {
      count += countAssignmentsInNode(value);
    }
  }

  return count;
}

function countBranchWrites(chain) {
  let writes = 0;

  for (const ifNode of chain) {
    writes += countAssignmentsInNode(ifNode.consequent);
    if (ifNode.alternate && ifNode.alternate.type !== "IfStatement") {
      writes += countAssignmentsInNode(ifNode.alternate);
    }
  }

  return writes;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [
      {
        type: "object",
        properties: {
          maxChainLength: { type: "integer", minimum: 1 },
          maxBranchWrites: { type: "integer", minimum: 0 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooLong: "Conditional chain is too long ({{length}} branches, max {{max}}).",
      tooManyWrites: "Conditional chain performs too many writes/definitions ({{count}}, max {{max}})."
    }
  },

  create(context) {
    const options = {
      maxChainLength: 2,
      maxBranchWrites: 2,
      ...(context.options[0] || {})
    };

    return {
      IfStatement(node) {
        if (!isRootIf(node)) return;

        const chain = getIfChain(node);
        const branchCount = chain.length;

        if (branchCount > options.maxChainLength) {
          context.report({
            node,
            messageId: "tooLong",
            data: {
              length: String(branchCount),
              max: String(options.maxChainLength)
            }
          });
        }

        const writes = countBranchWrites(chain);
        if (writes > options.maxBranchWrites) {
          context.report({
            node,
            messageId: "tooManyWrites",
            data: {
              count: String(writes),
              max: String(options.maxBranchWrites)
            }
          });
        }
      }
    };
  }
};
