const DOC_HINT = " See docs/rules/no-mixed-ui-and-domain-logic-in-component.md.";

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

function isPascalCase(name) {
  return typeof name === "string" && /^[A-Z][\dA-Za-z]+$/.test(name);
}

function getFunctionName(node) {
  if (!node) return;

  if (node.type === "FunctionDeclaration") {
    return node.id?.name;
  }

  if (
    (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") &&
    node.parent?.type === "VariableDeclarator" &&
    node.parent.id?.type === "Identifier"
  ) {
    return node.parent.id.name;
  }

  return;
}

function getBodyNode(node) {
  if (!node) return;

  if (node.type === "FunctionDeclaration") return node.body;
  if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") {
    return node.body;
  }

  return;
}

function containsJsx(node) {
  let found = false;

  walk(node, (child) => {
    if (found) return;
    if (child.type === "JSXElement" || child.type === "JSXFragment") {
      found = true;
    }
  });

  return found;
}

const COMPLEXITY_NODE_TYPES = new Set([
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

function countComplexityNodes(node) {
  let count = 0;

  walk(node, (child) => {
    if (COMPLEXITY_NODE_TYPES.has(child.type)) {
      count += 1;
    }
  });

  return count;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when UI components contain heavy inline domain/control logic"
    },
    schema: [
      {
        type: "object",
        properties: {
          maxComplexityNodes: { type: "integer", minimum: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      mixedUiDomainLogic: `Component '{{name}}' mixes rendering with heavy logic ({{count}} complexity nodes, max {{max}}). Extract view-model/domain shaping helpers.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      maxComplexityNodes: 6,
      ...context.options[0]
    };

    function inspectFunction(node) {
      const name = getFunctionName(node);
      if (!isPascalCase(name)) return;

      const body = getBodyNode(node);
      if (!body) return;
      if (!containsJsx(body)) return;

      const complexityCount = countComplexityNodes(body);
      if (complexityCount <= options.maxComplexityNodes) return;

      context.report({
        node,
        messageId: "mixedUiDomainLogic",
        data: {
          name,
          count: String(complexityCount),
          max: String(options.maxComplexityNodes)
        }
      });
    }

    return {
      FunctionDeclaration: inspectFunction,
      FunctionExpression: inspectFunction,
      ArrowFunctionExpression: inspectFunction
    };
  }
};
