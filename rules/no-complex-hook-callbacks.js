const DOC_HINT = " See docs/rules/no-complex-hook-callbacks.md.";

function isFunctionNode(node) {
  return (
    node &&
    (node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration")
  );
}

function walkWithoutNestedFunctions(node, visitor, rootNode = node) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  if (node !== rootNode && isFunctionNode(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        walkWithoutNestedFunctions(child, visitor, rootNode);
      }
    } else if (value && typeof value === "object") {
      walkWithoutNestedFunctions(value, visitor, rootNode);
    }
  }
}

function getHookName(node) {
  if (node?.callee?.type === "Identifier") {
    return node.callee.name;
  }

  if (
    node?.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier"
  ) {
    return node.callee.property.name;
  }

  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow logic-heavy callbacks passed to React hooks"
    },
    schema: [
      {
        type: "object",
        properties: {
          hooks: {
            type: "array",
            items: { type: "string" }
          },
          maxStatements: { type: "integer", minimum: 0 },
          maxBranches: { type: "integer", minimum: 0 },
          maxVariableDeclarations: { type: "integer", minimum: 0 },
          disallowTernary: { type: "boolean" },
          disallowNestedTernary: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      complexHookCallback: `Keep {{hook}} callbacks small. {{reason}}.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      hooks: ["useCallback", "useMemo", "useEffect"],
      maxStatements: 5,
      maxBranches: 1,
      maxVariableDeclarations: 1,
      disallowTernary: false,
      disallowNestedTernary: true,
      ...(context.options[0] || {})
    };

    return {
      CallExpression(node) {
        const hook = getHookName(node);
        if (!hook || !options.hooks.includes(hook)) return;

        const callback = node.arguments[0];
        if (!isFunctionNode(callback)) return;

        const reasons = new Set();

        if (callback.body.type === "BlockStatement") {
          const statementCount = callback.body.body.length;
          if (statementCount > options.maxStatements) {
            reasons.add(`It has ${statementCount} statements (max ${options.maxStatements})`);
          }
        }

        let branchCount = 0;
        let variableDeclarations = 0;
        let ternaryCount = 0;
        let nestedTernaryFound = false;

        walkWithoutNestedFunctions(callback.body, (child) => {
          if (child.type === "IfStatement" || child.type === "SwitchStatement") {
            branchCount += 1;
          }

          if (child.type === "VariableDeclaration") {
            variableDeclarations += child.declarations.length;
          }

          if (child.type === "ConditionalExpression") {
            ternaryCount += 1;

            if (
              child.consequent?.type === "ConditionalExpression" ||
              child.alternate?.type === "ConditionalExpression"
            ) {
              nestedTernaryFound = true;
            }
          }
        });

        if (branchCount > options.maxBranches) {
          reasons.add(`It has ${branchCount} branches (max ${options.maxBranches})`);
        }

        if (variableDeclarations > options.maxVariableDeclarations) {
          reasons.add(`It declares ${variableDeclarations} variables (max ${options.maxVariableDeclarations})`);
        }

        if (options.disallowTernary && ternaryCount > 0) {
          reasons.add("Do not use ternaries inside hook callbacks");
        }

        if (options.disallowNestedTernary && nestedTernaryFound) {
          reasons.add("Do not use nested ternaries inside hook callbacks");
        }

        if (reasons.size === 0) return;

        context.report({
          node: callback,
          messageId: "complexHookCallback",
          data: {
            hook,
            reason: [...reasons].join(". ")
          }
        });
      }
    };
  }
};
