const LOOP_NODE_TYPES = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement"
]);

const DEFAULT_CONTROL_NODE_TYPES = new Set(["IfStatement", "SwitchStatement", ...LOOP_NODE_TYPES]);
const FUNCTION_NODE_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

function isLoopNode(node) {
  return Boolean(node && LOOP_NODE_TYPES.has(node.type));
}

function isFunctionNode(node) {
  return Boolean(node && FUNCTION_NODE_TYPES.has(node.type));
}

function isElseIfBranch(node, parent) {
  return Boolean(
    node && parent && node.type === "IfStatement" && parent.type === "IfStatement" && parent.alternate === node
  );
}

function getSingleStatement(node) {
  if (!node) {
    return null;
  }

  if (node.type === "BlockStatement") {
    return node.body.length === 1 ? node.body[0] : null;
  }

  return node;
}

function isImmediateExitStatement(node) {
  return Boolean(
    node &&
    (node.type === "ReturnStatement" ||
      node.type === "ThrowStatement" ||
      node.type === "ContinueStatement" ||
      node.type === "BreakStatement")
  );
}

function isGuardClauseIfStatement(node, ignoreGuardClauses) {
  if (!ignoreGuardClauses || node?.type !== "IfStatement" || node.alternate) {
    return false;
  }

  return isImmediateExitStatement(getSingleStatement(node.consequent));
}

function countNesting(node, trackedNodeTypes, ignoreGuardClauses) {
  let controlDepth = 0;
  let loopDepth = 0;
  let current = node;
  let parent = node?.parent;

  while (current && parent) {
    if (isFunctionNode(parent)) {
      break;
    }

    const countsAsControl =
      trackedNodeTypes.has(parent.type) &&
      !isElseIfBranch(current, parent) &&
      !isGuardClauseIfStatement(parent, ignoreGuardClauses);
    if (countsAsControl) {
      controlDepth += 1;

      if (isLoopNode(parent)) {
        loopDepth += 1;
      }
    }

    current = parent;
    parent = parent.parent;
  }

  if (trackedNodeTypes.has(node.type) && !isGuardClauseIfStatement(node, ignoreGuardClauses)) {
    controlDepth += 1;

    if (isLoopNode(node)) {
      loopDepth += 1;
    }
  }

  return {
    controlDepth,
    loopDepth
  };
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow overly deep nested control flow in function bodies"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: { type: "integer", minimum: 1 },
          maxLoopDepth: { type: "integer", minimum: 1 },
          ignoreGuardClauses: { type: "boolean" },
          trackedNodeTypes: {
            type: "array",
            items: {
              type: "string",
              enum: [...DEFAULT_CONTROL_NODE_TYPES]
            },
            minItems: 1,
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooDeep:
        "Control-flow nesting is too deep ({{depth}} levels, max {{maxDepth}}). Extract a helper or invert the branch structure.",
      tooManyNestedLoops:
        "Nested loops are too deep ({{depth}} levels, max {{maxLoopDepth}}). Flatten the iteration or precompute data before looping."
    }
  },

  create(context) {
    const options = {
      maxDepth: 2,
      maxLoopDepth: 1,
      ignoreGuardClauses: true,
      trackedNodeTypes: [...DEFAULT_CONTROL_NODE_TYPES],
      ...(context.options[0] || {})
    };

    const trackedNodeTypes = new Set(options.trackedNodeTypes);

    function checkNode(node) {
      if (!trackedNodeTypes.has(node.type)) {
        return;
      }

      if (isGuardClauseIfStatement(node, options.ignoreGuardClauses)) {
        return;
      }

      const { controlDepth, loopDepth } = countNesting(node, trackedNodeTypes, options.ignoreGuardClauses);

      if (controlDepth > options.maxDepth) {
        context.report({
          node,
          messageId: "tooDeep",
          data: {
            depth: String(controlDepth),
            maxDepth: String(options.maxDepth)
          }
        });
        return;
      }

      if (isLoopNode(node) && loopDepth > options.maxLoopDepth) {
        context.report({
          node,
          messageId: "tooManyNestedLoops",
          data: {
            depth: String(loopDepth),
            maxLoopDepth: String(options.maxLoopDepth)
          }
        });
      }
    }

    return {
      IfStatement: checkNode,
      ForStatement: checkNode,
      ForInStatement: checkNode,
      ForOfStatement: checkNode,
      WhileStatement: checkNode,
      DoWhileStatement: checkNode,
      SwitchStatement: checkNode
    };
  }
};
