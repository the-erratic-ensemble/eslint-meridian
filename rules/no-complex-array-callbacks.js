const LOOP_TYPES = new Set(["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"]);

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

function getMethodName(node) {
  if (
    node?.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier"
  ) {
    return node.callee.property.name;
  }

  return null;
}

function isWithinJsxExpressionContainer(node) {
  let current = node?.parent;

  while (current) {
    if (current.type === "JSXExpressionContainer") {
      return true;
    }
    current = current.parent;
  }

  return false;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow logic-heavy callbacks passed to array methods"
    },
    schema: [
      {
        type: "object",
        properties: {
          methods: {
            type: "array",
            items: { type: "string" }
          },
          requireExpressionBody: { type: "boolean" },
          maxStatements: { type: "integer", minimum: 0 },
          disallowVariableDeclarations: { type: "boolean" },
          disallowIf: { type: "boolean" },
          disallowSwitch: { type: "boolean" },
          disallowLoops: { type: "boolean" },
          disallowNestedFunctions: { type: "boolean" },
          disallowTernary: { type: "boolean" },
          skipJsxCollectionMethods: {
            type: "array",
            items: { type: "string" }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      complexCallback: "Keep {{method}} callbacks simple. {{reason}}"
    }
  },

  create(context) {
    const options = {
      methods: ["map", "filter", "find", "some", "every", "flatMap", "reduce"],
      requireExpressionBody: false,
      maxStatements: 1,
      disallowVariableDeclarations: true,
      disallowIf: true,
      disallowSwitch: true,
      disallowLoops: true,
      disallowNestedFunctions: true,
      disallowTernary: false,
      skipJsxCollectionMethods: ["map", "flatMap"],
      ...(context.options[0] || {})
    };

    return {
      CallExpression(node) {
        const method = getMethodName(node);
        if (!method || !options.methods.includes(method)) return;

        if (options.skipJsxCollectionMethods.includes(method) && isWithinJsxExpressionContainer(node)) {
          return;
        }

        const callback = node.arguments.find(isFunctionNode);
        if (!callback) return;

        const reasons = new Set();

        if (options.requireExpressionBody && callback.body.type === "BlockStatement") {
          reasons.add("Use an expression-bodied callback instead of a block body");
        }

        if (callback.body.type === "BlockStatement" && callback.body.body.length > options.maxStatements) {
          reasons.add(`It has ${callback.body.body.length} statements (max ${options.maxStatements})`);
        }

        walkWithoutNestedFunctions(callback.body, (child) => {
          if (child === callback) return;

          if (options.disallowVariableDeclarations && child.type === "VariableDeclaration") {
            reasons.add("Move variable setup out of the callback");
          }

          if (options.disallowIf && child.type === "IfStatement") {
            reasons.add("Move branching out of the callback");
          }

          if (options.disallowSwitch && child.type === "SwitchStatement") {
            reasons.add("Move switch logic out of the callback");
          }

          if (options.disallowLoops && LOOP_TYPES.has(child.type)) {
            reasons.add("Do not put loop logic inside the callback");
          }

          if (options.disallowNestedFunctions && child !== callback && isFunctionNode(child)) {
            reasons.add("Do not nest extra functions inside the callback");
          }

          if (options.disallowTernary && child.type === "ConditionalExpression") {
            reasons.add("Do not use ternaries inside the callback");
          }
        });

        if (reasons.size === 0) return;

        context.report({
          node: callback,
          messageId: "complexCallback",
          data: {
            method,
            reason: `${[...reasons].join(". ")}. Try extracting this callback into a named helper before rendering.`
          }
        });
      }
    };
  }
};
