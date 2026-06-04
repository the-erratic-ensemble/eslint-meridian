function getIfChain(node) {
  const chain = [];
  let current = node;

  while (current && current.type === "IfStatement") {
    chain.push(current);
    current = current.alternate && current.alternate.type === "IfStatement" ? current.alternate : null;
  }

  return chain;
}

const FUNCTION_NODE_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

function getBranchStatements(node) {
  if (!node) {
    return [];
  }

  if (node.type === "BlockStatement") {
    return node.body;
  }

  return [node];
}

function getAssignmentTargetName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  return null;
}

function collectMutatedIdentifiers(node, mutatedNames) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (FUNCTION_NODE_TYPES.has(node.type)) {
    return;
  }

  if (node.type === "AssignmentExpression") {
    const targetName = getAssignmentTargetName(node.left);
    if (targetName) {
      mutatedNames.add(targetName);
    }
  }

  if (node.type === "UpdateExpression") {
    const targetName = getAssignmentTargetName(node.argument);
    if (targetName) {
      mutatedNames.add(targetName);
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        collectMutatedIdentifiers(child, mutatedNames);
      }
      continue;
    }

    if (value && typeof value === "object") {
      collectMutatedIdentifiers(value, mutatedNames);
    }
  }
}

function collectChainMutations(chain) {
  const mutatedNames = new Set();

  for (const ifNode of chain) {
    for (const statement of getBranchStatements(ifNode.consequent)) {
      collectMutatedIdentifiers(statement, mutatedNames);
    }

    if (ifNode.alternate && ifNode.alternate.type !== "IfStatement") {
      for (const statement of getBranchStatements(ifNode.alternate)) {
        collectMutatedIdentifiers(statement, mutatedNames);
      }
    }
  }

  return mutatedNames;
}

function isInitializedLetVariable(node) {
  return (
    node.type === "VariableDeclaration" &&
    node.kind === "let" &&
    node.declarations.length === 1 &&
    node.declarations[0]?.id?.type === "Identifier" &&
    node.declarations[0]?.init != null
  );
}

function getNextSiblingStatement(node) {
  const parent = node.parent;
  if (!parent || !Array.isArray(parent.body)) {
    return null;
  }

  const index = parent.body.indexOf(node);
  if (index < 0) {
    return null;
  }

  return parent.body[index + 1] ?? null;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow initialized let declarations that are immediately followed by if/else chain mutation of the same variable."
    },
    schema: [
      {
        type: "object",
        properties: {
          requireElseBranch: { type: "boolean" },
          minBranchMutations: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      avoidLetMutationChain:
        "Avoid initializing let '{{name}}' and then mutating it across a following if/else chain. Prefer a direct expression, helper, or early-return structure."
    }
  },

  create(context) {
    const options = {
      requireElseBranch: false,
      minBranchMutations: 1,
      ...(context.options[0] || {})
    };

    return {
      VariableDeclaration(node) {
        if (!isInitializedLetVariable(node)) {
          return;
        }

        const declaration = node.declarations[0];
        const variableName = declaration.id.name;
        const nextStatement = getNextSiblingStatement(node);

        if (!nextStatement || nextStatement.type !== "IfStatement") {
          return;
        }

        const chain = getIfChain(nextStatement);
        const hasTerminalElse = Boolean(chain.at(-1)?.alternate && chain.at(-1)?.alternate.type !== "IfStatement");
        if (options.requireElseBranch && !hasTerminalElse) {
          return;
        }

        const mutatedNames = collectChainMutations(chain);
        if (!mutatedNames.has(variableName)) {
          return;
        }

        const branchMutationCount = chain.reduce((count, ifNode) => {
          const branchMutations = new Set();

          for (const statement of getBranchStatements(ifNode.consequent)) {
            collectMutatedIdentifiers(statement, branchMutations);
          }

          if (ifNode.alternate && ifNode.alternate.type !== "IfStatement") {
            for (const statement of getBranchStatements(ifNode.alternate)) {
              collectMutatedIdentifiers(statement, branchMutations);
            }
          }

          return branchMutations.has(variableName) ? count + 1 : count;
        }, 0);

        if (branchMutationCount < options.minBranchMutations) {
          return;
        }

        context.report({
          node: declaration.id,
          messageId: "avoidLetMutationChain",
          data: {
            name: variableName
          }
        });
      }
    };
  }
};
