const CONTROL_FLOW_TYPES = new Set([
  "IfStatement",
  "SwitchStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "TryStatement",
  "ConditionalExpression"
]);

const FUNCTION_TYPES = new Set(["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration"]);

function getJsxAttributeName(node) {
  if (!node?.name) return null;

  if (node.name.type === "JSXIdentifier") {
    return node.name.name;
  }

  if (node.name.type === "JSXNamespacedName") {
    return `${node.name.namespace.name}:${node.name.name.name}`;
  }

  return null;
}

function isDomElementName(name) {
  return typeof name === "string" && /^[a-z]/.test(name);
}

function getOpeningElementName(openingElement) {
  if (!openingElement?.name) return null;

  if (openingElement.name.type === "JSXIdentifier") {
    return openingElement.name.name;
  }

  return null;
}

function isFunctionNode(node) {
  return node && FUNCTION_TYPES.has(node.type);
}

function isCallLike(node) {
  if (!node) return false;

  if (node.type === "CallExpression") return true;

  if (node.type === "ChainExpression") {
    return isCallLike(node.expression);
  }

  if (node.type === "AwaitExpression") {
    return isCallLike(node.argument);
  }

  return false;
}

function isIifeCall(node) {
  if (!node) return false;

  if (node.type === "CallExpression") {
    return isFunctionNode(node.callee);
  }

  if (node.type === "ChainExpression") {
    return isIifeCall(node.expression);
  }

  return false;
}

function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") {
    visitor(node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, visitor);
      }
    } else if (value && typeof value === "object") {
      walk(value, visitor);
    }
  }
}

function getInlineHandlerBodyLineCount(functionNode) {
  if (!functionNode?.body?.loc) {
    return Number.POSITIVE_INFINITY;
  }

  if (functionNode.body.type !== "BlockStatement") {
    return functionNode.body.loc.end.line - functionNode.body.loc.start.line + 1;
  }

  const statements = functionNode.body.body;
  if (statements.length === 0) {
    return 0;
  }

  const firstStatement = statements[0];
  const lastStatement = statements.at(-1);

  if (!firstStatement?.loc || !lastStatement?.loc) {
    return Number.POSITIVE_INFINITY;
  }

  return lastStatement.loc.end.line - firstStatement.loc.start.line + 1;
}

function collectInlineFunctionReasons(functionNode, options) {
  const reasons = new Set();
  const bodyLineCount = getInlineHandlerBodyLineCount(functionNode);

  if (bodyLineCount <= options.maxBodyLines) {
    return reasons;
  }

  // Expression-bodied handler: allow only a very small shape like () => doThing()
  if (functionNode.body.type !== "BlockStatement") {
    if (!options.allowSimpleExpressions) {
      reasons.add("expression-bodied inline functions are not allowed");
    } else if (!isCallLike(functionNode.body)) {
      reasons.add("only a simple function call is allowed inline");
    }

    return reasons;
  }

  const statements = functionNode.body.body.length;

  if (statements > options.maxStatements) {
    reasons.add(`it contains ${statements} statements (max: ${options.maxStatements})`);
  }

  walk(functionNode.body, (child) => {
    if (child === functionNode.body) return;

    if (options.disallowVariableDeclarations && child.type === "VariableDeclaration") {
      reasons.add("variable declarations are not allowed inline");
    }

    if (options.disallowControlFlow && CONTROL_FLOW_TYPES.has(child.type)) {
      reasons.add(`control flow (${child.type}) is not allowed inline`);
    }

    if (options.disallowNestedFunctions && child !== functionNode && isFunctionNode(child)) {
      reasons.add("nested functions/callbacks are not allowed inline");
    }
  });

  return reasons;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow complex inline JSX handlers and nested inline prop IIFEs that should be moved out of JSX"
    },
    schema: [
      {
        type: "object",
        properties: {
          propPattern: { type: "string" },
          maxBodyLines: { type: "integer", minimum: 0 },
          maxStatements: { type: "integer", minimum: 0 },
          allowSimpleExpressions: { type: "boolean" },
          disallowVariableDeclarations: { type: "boolean" },
          disallowControlFlow: { type: "boolean" },
          disallowNestedFunctions: { type: "boolean" },
          ignoreDOMElements: { type: "boolean" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      moveHandler: "Move this inline '{{propName}}' handler out of JSX; {{reason}}.",
      moveInlineComputation: "Move this inline '{{propName}}' computation out of JSX; {{reason}}."
    }
  },

  create(context) {
    const options = {
      propPattern: "^on[A-Z]",
      maxBodyLines: 2,
      maxStatements: 1,
      allowSimpleExpressions: true,
      disallowVariableDeclarations: true,
      disallowControlFlow: true,
      disallowNestedFunctions: true,
      ignoreDOMElements: false,
      ...(context.options[0] || {})
    };

    const propRegex = new RegExp(options.propPattern);

    return {
      JSXAttribute(node) {
        const propName = getJsxAttributeName(node);
        if (!propName) return;

        const parentOpeningElement = node.parent;
        const elementName = getOpeningElementName(parentOpeningElement);

        if (options.ignoreDOMElements && isDomElementName(elementName)) {
          return;
        }

        if (!node.value || node.value.type !== "JSXExpressionContainer") {
          return;
        }

        const expr = node.value.expression;

        if (propRegex.test(propName) && isFunctionNode(expr)) {
          const reasons = collectInlineFunctionReasons(expr, options);

          if (reasons.size === 0) return;

          context.report({
            node,
            messageId: "moveHandler",
            data: {
              propName,
              reason: [...reasons].join(", ")
            }
          });
        }

        walk(expr, (child) => {
          if (child === expr || !isIifeCall(child)) {
            return;
          }

          if (child.parent?.type === "JSXExpressionContainer") {
            return;
          }

          const inlineFunctionNode = child.type === "CallExpression" ? child.callee : child.expression.callee;
          const reasons = collectInlineFunctionReasons(inlineFunctionNode, options);

          if (reasons.size === 0) {
            return;
          }

          context.report({
            node: child,
            messageId: "moveInlineComputation",
            data: {
              propName,
              reason: [...reasons].join(", ")
            }
          });
        });
      }
    };
  }
};
