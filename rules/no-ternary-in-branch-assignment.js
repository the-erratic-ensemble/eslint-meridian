function getBranchStatements(node) {
  if (!node) return [];
  if (node.type === "BlockStatement") return node.body;
  return [node];
}

const FUNCTION_NODE_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

function getAssignmentTargetName(node) {
  if (!node) return null;

  if (node.type === "Identifier") return node.name;

  if (node.type === "MemberExpression" && !node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }

  return null;
}

function walkBranchTree(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") {
    visitor(node);
  }

  if (FUNCTION_NODE_TYPES.has(node.type) || node.type === "IfStatement") {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        walkBranchTree(child, visitor);
      }
      continue;
    }

    if (value && typeof value === "object") {
      walkBranchTree(value, visitor);
    }
  }
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow ternary-based assignments/returns inside if/else branches"
    },
    schema: [
      {
        type: "object",
        properties: {
          checkAssignments: { type: "boolean" },
          checkVariableDeclarations: { type: "boolean" },
          checkReturnStatements: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      ternaryAssignment:
        "Do not use a ternary to assign {{name}} inside an if/else branch. Extract the decision or expand the branch.",
      ternaryDeclaration:
        "Do not initialize {{name}} with a ternary inside an if/else branch. Extract the decision or expand the branch.",
      ternaryReturn:
        "Do not return a ternary directly from an if/else branch. Extract the decision or expand the branch."
    }
  },

  create(context) {
    const options = {
      checkAssignments: true,
      checkVariableDeclarations: true,
      checkReturnStatements: false,
      ...(context.options[0] || {})
    };

    function inspectBranch(statement) {
      walkBranchTree(statement, (child) => {
        if (
          options.checkAssignments &&
          child.type === "AssignmentExpression" &&
          child.right?.type === "ConditionalExpression"
        ) {
          context.report({
            node: child.right,
            messageId: "ternaryAssignment",
            data: {
              name: getAssignmentTargetName(child.left) || "value"
            }
          });
        }

        if (
          options.checkVariableDeclarations &&
          child.type === "VariableDeclarator" &&
          child.init?.type === "ConditionalExpression"
        ) {
          context.report({
            node: child.init,
            messageId: "ternaryDeclaration",
            data: {
              name: child.id?.type === "Identifier" ? child.id.name : "value"
            }
          });
        }

        if (
          options.checkReturnStatements &&
          child.type === "ReturnStatement" &&
          child.argument?.type === "ConditionalExpression"
        ) {
          context.report({
            node: child.argument,
            messageId: "ternaryReturn"
          });
        }
      });
    }

    return {
      IfStatement(node) {
        for (const statement of getBranchStatements(node.consequent)) {
          inspectBranch(statement);
        }

        if (node.alternate && node.alternate.type !== "IfStatement") {
          for (const statement of getBranchStatements(node.alternate)) {
            inspectBranch(statement);
          }
        }
      }
    };
  }
};
