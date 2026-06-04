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

function walkWithoutNestedFunctions(node, visitor, rootNode = node) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);

  if (node !== rootNode && isFunctionNode(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value) walkWithoutNestedFunctions(child, visitor, rootNode);
    } else if (value && typeof value === "object") {
      walkWithoutNestedFunctions(value, visitor, rootNode);
    }
  }
}

function isFunctionNode(node) {
  return node && (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression");
}

function getCallInfo(node) {
  if (!node || node.type !== "CallExpression") return null;
  if (!node.callee || node.callee.type !== "MemberExpression") return null;
  if (node.callee.computed) return null;
  if (node.callee.property.type !== "Identifier") return null;

  return {
    method: node.callee.property.name,
    callback: node.arguments[0]
  };
}

function collectCallInfos(node, methods) {
  const matches = [];

  walkWithoutNestedFunctions(node, (child) => {
    const info = getCallInfo(child);
    if (!info) return;
    if (!methods.includes(info.method)) return;
    if (!isFunctionNode(info.callback)) return;

    matches.push({
      node: child,
      ...info
    });
  });

  return matches;
}

function jsxDepth(node) {
  if (!node) return 0;
  if (node.type !== "JSXElement" && node.type !== "JSXFragment") return 0;

  const children = node.children || [];
  let maxChildDepth = 0;

  for (const child of children) {
    const depth = jsxDepth(child);
    if (depth > maxChildDepth) maxChildDepth = depth;
  }

  return 1 + maxChildDepth;
}

function getReturnedJsxDepth(fn) {
  if (!fn) return 0;

  if (fn.type === "ArrowFunctionExpression" && (fn.body.type === "JSXElement" || fn.body.type === "JSXFragment")) {
    return jsxDepth(fn.body);
  }

  if (fn.body.type !== "BlockStatement") return 0;

  let maxDepth = 0;
  walk(fn.body, (child) => {
    if (
      child.type === "ReturnStatement" &&
      child.argument &&
      (child.argument.type === "JSXElement" || child.argument.type === "JSXFragment")
    ) {
      maxDepth = Math.max(maxDepth, jsxDepth(child.argument));
    }
  });

  return maxDepth;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    schema: [
      {
        type: "object",
        properties: {
          methods: {
            type: "array",
            items: { type: "string" }
          },
          disallowBlockBody: { type: "boolean" },
          maxStatements: { type: "integer", minimum: 0 },
          disallowVariableDeclarations: { type: "boolean" },
          disallowIf: { type: "boolean" },
          disallowSwitch: { type: "boolean" },
          disallowInlineHandlerBlocks: { type: "boolean" },
          maxReturnedJsxDepth: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      complex:
        "Keep JSX {{method}} callbacks simple. Move logic out of the callback. Try extracting a named render helper and pass it to {{method}}."
    }
  },

  create(context) {
    const rawOptions = {
      methods: ["map", "flatMap"],
      disallowBlockBody: true,
      maxStatements: 1,
      disallowVariableDeclarations: true,
      disallowIf: true,
      disallowSwitch: true,
      disallowInlineHandlerBlocks: true,
      maxReturnedJsxDepth: 2,
      ...(context.options[0] || {})
    };
    const options = rawOptions;

    return {
      JSXExpressionContainer(node) {
        for (const info of collectCallInfos(node.expression, options.methods)) {
          const fn = info.callback;
          let bad = false;

          if (options.disallowBlockBody && fn.body.type === "BlockStatement") {
            bad = true;
          }

          if (fn.body.type === "BlockStatement") {
            if (fn.body.body.length > options.maxStatements) {
              bad = true;
            }

            walk(fn.body, (child) => {
              if (options.disallowVariableDeclarations && child.type === "VariableDeclaration") {
                bad = true;
              }
              if (options.disallowIf && child.type === "IfStatement") {
                bad = true;
              }
              if (options.disallowSwitch && child.type === "SwitchStatement") {
                bad = true;
              }
            });
          }

          if (options.disallowInlineHandlerBlocks) {
            walk(fn.body, (child) => {
              if (child.type !== "JSXAttribute") return;
              if (!child.value || child.value.type !== "JSXExpressionContainer") return;
              const inlineHandler = child.value.expression;
              if (!isFunctionNode(inlineHandler)) return;
              if (inlineHandler.body.type === "BlockStatement") {
                bad = true;
              }
            });
          }

          if (getReturnedJsxDepth(fn) > options.maxReturnedJsxDepth) {
            bad = true;
          }

          if (bad) {
            context.report({
              node: info.node,
              messageId: "complex",
              data: { method: info.method }
            });
          }
        }
      }
    };
  }
};
