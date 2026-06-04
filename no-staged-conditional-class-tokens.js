const DOC_HINT = " See docs/rules/no-staged-conditional-class-tokens.md.";

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

function getJsxAttributeName(node) {
  if (!node?.name) return;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  return;
}

function hasConditionalNode(node, operators) {
  let found = false;

  walk(node, (child) => {
    if (found) return;

    if (child.type === "ConditionalExpression") {
      found = true;
      return;
    }

    if (child.type === "LogicalExpression" && operators.includes(child.operator)) {
      found = true;
    }
  });

  return found;
}

function collectIdentifierNames(node, names = new Set()) {
  walk(node, (child) => {
    if (child.type === "Identifier") {
      names.add(child.name);
    }
  });

  return names;
}

function getIdentifierName(node) {
  return node?.id?.type === "Identifier" ? node.id.name : null;
}

function collectPatternIdentifierNames(pattern, names = []) {
  if (!pattern) return names;

  if (pattern.type === "Identifier") {
    names.push(pattern.name);
    return names;
  }

  if (pattern.type === "AssignmentPattern") {
    return collectPatternIdentifierNames(pattern.left, names);
  }

  if (pattern.type === "RestElement") {
    return collectPatternIdentifierNames(pattern.argument, names);
  }

  if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) {
      collectPatternIdentifierNames(element, names);
    }

    return names;
  }

  if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      if (!property) continue;

      if (property.type === "Property") {
        collectPatternIdentifierNames(property.value, names);
        continue;
      }

      if (property.type === "RestElement") {
        collectPatternIdentifierNames(property.argument, names);
      }
    }
  }

  return names;
}

function createNameMatcher(pattern) {
  try {
    return new RegExp(pattern);
  } catch {
    return /(?:className|Class|Classes|ClassName)$/;
  }
}

function createScopeStack() {
  const scopes = [];

  return {
    enter() {
      scopes.push({
        candidates: new Set(),
        declarations: new Set()
      });
    },
    exit() {
      scopes.pop();
    },
    declare(name) {
      scopes.at(-1)?.declarations.add(name);
    },
    addCandidate(name) {
      const currentScope = scopes.at(-1);
      currentScope?.declarations.add(name);
      currentScope?.candidates.add(name);
    },
    hasVisibleCandidate(name) {
      for (let index = scopes.length - 1; index >= 0; index -= 1) {
        const scope = scopes[index];
        if (scope.declarations.has(name)) {
          return scope.candidates.has(name);
        }
      }

      return false;
    }
  };
}

function declareFunctionParameters(scopeStack, node) {
  for (const parameter of node.params ?? []) {
    for (const name of collectPatternIdentifierNames(parameter)) {
      scopeStack.declare(name);
    }
  }
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when conditional class-token variables are staged before JSX and then injected into className"
    },
    schema: [
      {
        type: "object",
        properties: {
          propNames: {
            type: "array",
            items: { type: "string" }
          },
          namePattern: { type: "string" },
          logicalOperators: {
            type: "array",
            items: {
              type: "string",
              enum: ["&&", "||", "??"]
            }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      stagedConditionalClassToken: `Do not stage conditional class token '{{name}}' before JSX. Move the variant to \`cva\`/\`class-variance-authority\` or a named variant module before passing it to className.${DOC_HINT}`
    }
  },

  create(context) {
    const options = {
      propNames: ["className"],
      namePattern: "(?:className|Class|Classes|ClassName)$",
      logicalOperators: ["&&", "||", "??"],
      ...(context.options[0] || {})
    };
    const nameMatcher = createNameMatcher(options.namePattern);
    const conditionalClassTokenScopes = createScopeStack();

    return {
      Program() {
        conditionalClassTokenScopes.enter();
      },
      "Program:exit"() {
        conditionalClassTokenScopes.exit();
      },
      FunctionDeclaration(node) {
        conditionalClassTokenScopes.enter();
        declareFunctionParameters(conditionalClassTokenScopes, node);
      },
      "FunctionDeclaration:exit"() {
        conditionalClassTokenScopes.exit();
      },
      FunctionExpression(node) {
        conditionalClassTokenScopes.enter();
        declareFunctionParameters(conditionalClassTokenScopes, node);
      },
      "FunctionExpression:exit"() {
        conditionalClassTokenScopes.exit();
      },
      ArrowFunctionExpression(node) {
        conditionalClassTokenScopes.enter();
        declareFunctionParameters(conditionalClassTokenScopes, node);
      },
      "ArrowFunctionExpression:exit"() {
        conditionalClassTokenScopes.exit();
      },

      VariableDeclarator(node) {
        const name = getIdentifierName(node);
        if (!name) return;
        conditionalClassTokenScopes.declare(name);
        if (!nameMatcher.test(name)) return;
        if (!node.init || !hasConditionalNode(node.init, options.logicalOperators)) return;

        conditionalClassTokenScopes.addCandidate(name);
      },

      JSXAttribute(node) {
        const propName = getJsxAttributeName(node);
        if (!propName || !options.propNames.includes(propName)) return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;

        const referencedNames = collectIdentifierNames(node.value.expression);
        const stagedNames = [...referencedNames].filter((name) =>
          conditionalClassTokenScopes.hasVisibleCandidate(name)
        );
        if (stagedNames.length === 0) return;

        context.report({
          node,
          messageId: "stagedConditionalClassToken",
          data: {
            name: stagedNames[0]
          }
        });
      }
    };
  }
};
